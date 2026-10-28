import { useEffect, useRef, useState, type CSSProperties, type SubmitEvent } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, BookOpen, Check, ChevronRight, CircleHelp, FileText, Focus, Leaf, LockKeyhole, Menu, MessageCircle, Pin, Settings2, Sparkles, StickyNote, X } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog';

type Part = { type: string; id?: string; html?: string; source?: string; label?: string };
type Section = { id: string; title: string; parts: Part[] };
type Chapter = { id: string; title: string; revision: number; version: string; approved: boolean; readingMinutes: number; sections: Section[] };
type Attempt = { id: string; exercise: string; section: string; version: string; answer: string; assisted: boolean; createdAt: string };
type Note = { id: string; section: string; version: string; selection: string; question: string; answer: string; createdAt: string };
type StudyState = { notes: Note[]; attempts: Attempt[]; position: { section: string; version: string } | null };
type Selection = { section: string; text: string };
type Preferences = { theme: string; size: number; width: string; serif: boolean };
const defaults: Preferences = { theme: 'warm', size: 19, width: 'normal', serif: false };
async function post(path: string, data: unknown, signal?: AbortSignal) {
  const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), signal });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? 'No se pudo completar la operación.');
  return result;
}

function Diagram({ source, onAsk, readOnly }: { source: string; onAsk: () => void; readOnly: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    let cancelled = false;
    import('mermaid').then(async ({ default: mermaid }) => {
      mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'neutral', fontFamily: 'system-ui' });
      const { svg } = await mermaid.render(`diagram-${crypto.randomUUID()}`, source);
      if (!cancelled && ref.current) ref.current.innerHTML = svg;
    }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [source]);
  return <figure className={`diagram-card ${expanded ? 'expanded' : ''}`}>
    <figcaption><span><span className="small-dot" /> Mapa visual</span><button onClick={() => setExpanded(!expanded)}>{expanded ? 'Reducir' : 'Ampliar'}</button></figcaption>
    {error ? <p>El diagrama no pudo dibujarse. La explicación textual está a continuación.</p> : <div ref={ref} className="diagram" role="img" aria-label="Una imagen origina dos contenedores, cada uno con su propia capa de escritura." />}
    <button className="diagram-ask" disabled={readOnly} onClick={onAsk}><CircleHelp size={15} /> Preguntar sobre el diagrama</button>
  </figure>;
}

function Exercise({ part, section, attempts, save, assisted, readOnly }: { part: Part; section: string; attempts: Attempt[]; save: (data: object) => Promise<void>; assisted: boolean; readOnly: boolean }) {
  const previous = attempts.filter(a => a.exercise === part.id);
  const [answer, setAnswer] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError('');
    try { await save({ type: 'attempt', section, exercise: part.id, answer, assisted: assisted || open }); setOpen(true); }
    catch (error) { setError((error as Error).message); }
    finally { setSaving(false); }
  }
  return <div className="exercise-card">
    <div className="exercise-heading"><span className="eyebrow">Tu turno</span><span>{previous.length ? `${previous.length} intento${previous.length > 1 ? 's' : ''} guardado${previous.length > 1 ? 's' : ''}` : 'Puedes equivocarte aquí'}</span></div>
    <form onSubmit={submit}>
      <label htmlFor={`answer-${part.id}`}>Explica tu razonamiento antes de consultar el feedback.</label>
      <textarea id={`answer-${part.id}`} value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Creo que… porque…" maxLength={8000} required rows={3} readOnly={readOnly} />
      <div className="exercise-actions"><Button size="sm" disabled={readOnly || saving || !answer.trim()}>{readOnly ? 'Actividad disponible en el espacio personal' : saving ? 'Guardando…' : 'Guardar intento y ver feedback'}<ArrowRight size={15} /></Button>
        {previous.length > 0 && <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(!open)}>{open ? 'Ocultar feedback' : 'Ver feedback'}</Button>}</div>
    </form>
    {error && <p role="alert" className="error">{error}</p>}
    {open && previous.length > 0 && <div className="exercise-feedback"><p className="eyebrow">{part.label}</p><div className="prose" dangerouslySetInnerHTML={{ __html: part.html! }} /><p className="muted small">Compara las ideas, no las palabras exactas. Guardar el intento no certifica el dominio.</p></div>}
    {previous.length > 0 && <details className="attempt-history"><summary>Mis intentos anteriores</summary>{previous.map(a => <blockquote key={a.id}><p>{a.answer}</p><small>{a.assisted ? 'Con ayuda consultada' : 'Sin consulta al tutor registrada'} · {new Date(a.createdAt).toLocaleDateString('es')}</small></blockquote>)}</details>}
  </div>;
}

export default function Study({ chapter, initialState, readOnly = false }: { chapter: Chapter; initialState: StudyState; readOnly?: boolean }) {
  const [state, setState] = useState(initialState);
  const [active, setActive] = useState(chapter.sections[0]?.id ?? 'objetivo');
  const [prefs, setPrefs] = useState(defaults);
  const [ready, setReady] = useState(false);
  const [focus, setFocus] = useState(false);
  const [settings, setSettings] = useState(false);
  const [navigation, setNavigation] = useState(false);
  const [notebook, setNotebook] = useState(false);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [context, setContext] = useState<Selection | null>(null);
  const [question, setQuestion] = useState('');
  const [mode, setMode] = useState('explain');
  const [provider, setProvider] = useState('codex');
  const [history, setHistory] = useState<{ question: string; answer: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pinned, setPinned] = useState(false);
  const [assisted, setAssisted] = useState<string[]>([]);
  const controller = useRef<AbortController | null>(null);
  const restoring = useRef(true);
  const article = useRef<HTMLElement>(null);
  const dialogTrigger = useRef<HTMLElement | null>(null);
  const panelTrigger = useRef<HTMLElement | null>(null);
  function openPanel(panel: 'settings' | 'navigation' | 'notebook', trigger: HTMLElement) {
    panelTrigger.current = trigger;
    if (panel === 'settings') setSettings(true);
    if (panel === 'navigation') setNavigation(true);
    if (panel === 'notebook') setNotebook(true);
  }
  function restorePanelFocus(event: Event) { event.preventDefault(); panelTrigger.current?.focus(); }
  const currentAttempts = state.attempts.filter(a => a.version === chapter.version);
  const currentIndex = chapter.sections.findIndex(s => s.id === active);

  async function save(data: object) {
    if (readOnly) throw new Error('Vista compartida de solo lectura.');
    const next = await post('/api/study', { ...data, version: chapter.version });
    setState(next);
  }
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('understandly-reading') ?? 'null');
      if (stored) setPrefs({ theme: ['warm', 'light', 'dark'].includes(stored.theme) ? stored.theme : 'warm',
        size: [17, 19, 21, 23].includes(stored.size) ? stored.size : 19,
        width: stored.width === 'wide' ? 'wide' : 'normal', serif: stored.serif === true });
    } catch { /* Device preferences are optional. */ }
    setReady(true);
    const position = initialState.position;
    if (position?.version === chapter.version && chapter.sections.some(s => s.id === position.section)) {
      setActive(position.section);
      setTimeout(() => { document.getElementById(position.section)?.scrollIntoView(); restoring.current = false; }, 180);
    } else restoring.current = false;
    return () => controller.current?.abort();
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = prefs.theme;
    if (ready) try { localStorage.setItem('understandly-reading', JSON.stringify(prefs)); } catch { /* Reading remains usable. */ }
  }, [prefs, ready]);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (restoring.current) return;
      const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActive(visible[0].target.id);
    }, { rootMargin: '-90px 0px -60% 0px' });
    article.current?.querySelectorAll('section[id]').forEach(s => observer.observe(s));
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (readOnly || !ready || restoring.current) return;
    const timer = setTimeout(() => {
      post('/api/study', { type: 'position', section: active, version: chapter.version }).catch(() => setNotice('No se pudo guardar la posición. Puedes seguir leyendo.'));
    }, 900);
    return () => clearTimeout(timer);
  }, [active, ready]);
  useEffect(() => {
    const onSelect = () => {
      if (context) return;
      const range = window.getSelection();
      const text = range?.toString().trim();
      if (!text || text.length < 3 || !range?.anchorNode || !range.focusNode) { setSelection(null); return; }
      const anchor = range.anchorNode.parentElement?.closest('section[data-section]');
      const end = range.focusNode.parentElement?.closest('section[data-section]');
      if (anchor && end === anchor && article.current?.contains(anchor)) setSelection({ section: anchor.id, text: text.slice(0, 3000) });
    };
    document.addEventListener('selectionchange', onSelect);
    return () => document.removeEventListener('selectionchange', onSelect);
  }, [context]);
  function go(id: string) { setActive(id); setNavigation(false); document.getElementById(id)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); }
  function ask(selected: Selection, selectedMode = 'explain') {
    if (readOnly) return;
    dialogTrigger.current = document.activeElement as HTMLElement;
    setContext(selected); setHistory([]); setQuestion(''); setError(''); setMode(selectedMode); setPinned(false);
  }
  function closeTutor() { controller.current?.abort(); setContext(null); setBusy(false); }
  async function send(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault(); if (!context || busy) return;
    setBusy(true); setError(''); setPinned(false);
    controller.current = new AbortController();
    setAssisted(value => [...new Set([...value, context.section])]);
    try {
      const result = await post('/api/tutor', { ...context, selection: context.text, question, mode, provider, history, version: chapter.version }, controller.current.signal);
      setHistory(value => [...value, { question, answer: result.answer }]); setQuestion('');
    } catch (error) { if ((error as Error).name !== 'AbortError') setError((error as Error).message); }
    finally { setBusy(false); }
  }
  async function pin() {
    if (!context || !history.length) return;
    try { const last = history.at(-1)!; await save({ type: 'note', section: context.section, selection: context.text, ...last }); setPinned(true); setNotice('Respuesta guardada en tu cuaderno.'); }
    catch (error) { setError((error as Error).message); }
  }
  const notes = <><div className="notebook-heading"><span className="eyebrow">Tu cuaderno</span><span className="count">{state.notes.length}</span></div>
    <h3>Las ideas que te llevas.</h3><p className="muted small">Guarda una aclaración justo donde la necesitaste.</p>
    {!state.notes.length ? <div className="empty-notes"><StickyNote size={27} strokeWidth={1.3} /><p>Todo empieza con<br />una buena pregunta.</p><span>Selecciona un fragmento para conversar con tu tutor y anclar su respuesta aquí.</span></div> : state.notes.map(note => <button key={note.id} className="note-card" onClick={() => { if (note.version === chapter.version) go(note.section); setNotebook(false); }}>
      <span className="note-label"><Pin size={12} /> {note.version === chapter.version ? chapter.sections.find(s => s.id === note.section)?.title : 'Nota de una versión anterior'}</span>
      <strong>{note.question}</strong><blockquote>{note.selection}</blockquote><p>{note.answer}</p></button>)}
    <div className="learning-reminder"><Leaf size={18} /><p>Entender lleva su tiempo.<br /><strong>No necesitas acertar a la primera.</strong></p></div></>;
  const nav = <><div className="sidebar-course"><div className="course-icon"><BookOpen size={20} /></div><div><span className="eyebrow">Tu recorrido</span><h2>Docker desde cero</h2></div></div>
    <div className="course-label"><span>5 capítulos</span><span>Aprendizaje guiado</span></div>
    <div className="chapter-current"><span className="chapter-number">01</span><div><strong>El modelo mental</strong><small>Estudiando ahora</small></div><span className="small-dot" /></div>
    <nav aria-label="Secciones del capítulo" className="section-nav">{chapter.sections.map((section, i) => <a key={section.id} href={`#${section.id}`} aria-current={active === section.id ? 'location' : undefined} className={active === section.id ? 'active' : ''} onClick={e => { e.preventDefault(); go(section.id); }}><span>{String(i + 1).padStart(2, '0')}</span>{section.title}</a>)}</nav>
    <div className="future-chapters">{['Observar estados', 'Crear imágenes', 'Persistencia de datos', 'Unir las piezas'].map((title, i) => <div key={title}><span>{String(i + 2).padStart(2, '0')}</span><p>{title}<small>Por preparar</small></p><LockKeyhole size={13} /></div>)}</div>
    <div className="sidebar-footer"><span className="local-dot" /> Espacio local · Tus datos contigo</div></>;

  return <div className={`study-app ${focus ? 'focus-mode' : ''}`} style={{ '--reading-size': `${prefs.size}px`, '--reading-width': prefs.width === 'wide' ? '82ch' : '68ch' } as CSSProperties}>
    <a className="skip-link" href="#reading">Ir a la lectura</a>
    <header className="topbar"><div className="brand"><div className="brand-mark">u<span>·</span></div><span>understandly</span><span className="brand-tag">un poco más claro, cada día</span></div>
      <div className="header-actions"><Button variant="ghost" size="icon" onClick={event => openPanel('navigation', event.currentTarget)} className="mobile-menu" aria-label="Abrir recorrido"><Menu size={20} /></Button><Button variant="ghost" size="sm" onClick={() => setFocus(!focus)} aria-pressed={focus}><Focus size={17} /><span className="desktop-label">{focus ? 'Salir de lectura' : 'Modo lectura'}</span></Button><Button variant="ghost" size="icon" onClick={event => openPanel('settings', event.currentTarget)} aria-label="Ajustar lectura"><Settings2 size={19} /></Button><span className="header-divider" /><Button variant="outline" size="sm" onClick={event => openPanel('notebook', event.currentTarget)}><StickyNote size={16} /><span className="desktop-label">Mi cuaderno</span><span className="count">{state.notes.length}</span></Button><div className="avatar" aria-label="Espacio personal">M</div></div></header>
    {readOnly && <div className="share-banner" role="status"><BookOpen size={17} /><p><strong>Vista compartida · Solo lectura</strong> Puedes recorrer el capítulo y ajustar la lectura. La tutoría, las notas y los intentos permanecen en el espacio personal.</p></div>}
    <div className="workspace"><aside className="sidebar">{nav}</aside>
      <main id="reading" className={`reading-column ${prefs.serif ? 'serif-reading' : ''}`}>
        <div className="breadcrumb"><BookOpen size={14} /> Docker desde cero <ChevronRight size={13} /><span>Capítulo 01</span></div>
        <div className="chapter-intro"><div className="intro-meta"><span className="pill">FUNDAMENTOS</span><span>{chapter.readingMinutes} min de lectura · a tu ritmo</span></div>
          <h1>Primero, <em>entiende</em><br />las piezas.</h1><p className="intro-description">{chapter.title}. Un modelo mental claro antes de escribir tu primer comando.</p>
          <div className="chapter-status"><span className="approval-badge">{chapter.approved ? <Check size={14} /> : <FileText size={14} />}{chapter.approved ? 'Contenido revisado' : 'Revisión pendiente'}</span><span>Revisión {chapter.revision}</span><span>Sin comandos por ahora</span></div></div>
        <div className="reading-tip"><span className="tip-icon"><Sparkles size={18} /></span><p><strong>No te quedes con la duda.</strong> Selecciona cualquier fragmento para pedir una explicación o verlo de otra manera.</p><ArrowDown size={17} /></div>
        <article ref={article} className="chapter-article">{chapter.sections.map((section, index) => <section id={section.id} data-section={section.id} key={section.id}>
          <div className="section-title"><span className="section-number">{String(index + 1).padStart(2, '0')}</span><h2>{section.title}</h2><button disabled={readOnly} title={readOnly ? "Tutoría disponible solo en el espacio personal" : undefined} className="section-question" aria-label={`Preguntar sobre ${section.title}`} onClick={() => ask({ section: section.id, text: section.title })}><MessageCircle size={18} /></button></div>
          {section.parts.map((part, i) => part.type === 'html' ? <div key={i} className="prose" dangerouslySetInnerHTML={{ __html: part.html! }} /> : part.type === 'diagram' ? <Diagram readOnly={readOnly} key={i} source={part.source!} onAsk={() => ask({ section: section.id, text: part.source! })} /> : <Exercise key={part.id} part={part} section={section.id} save={save} attempts={currentAttempts} assisted={assisted.includes(section.id)} readOnly={readOnly} />)}
        </section>)}</article>
        <div className="end-chapter"><Leaf size={24} /><h2>Una idea más clara.<br />Un paso más adelante.</h2><p>Has llegado al final de la lectura. Tus intentos y tus notas quedan guardados; el dominio y la retención todavía necesitan comprobarse.</p><span>{currentAttempts.length} intentos guardados · {state.notes.length} notas</span><Button variant="outline" onClick={() => go('comprobacion')}>Volver a la comprobación<ArrowRight size={16} /></Button></div>
        <footer className="reading-footer"><span>Understandly · Aprender sin prisa, entender de verdad.</span><a href="#reading" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Volver al inicio ↑</a></footer>
      </main>
      <aside className="notebook-sidebar">{notes}</aside>
    </div>
    <div className="reading-location"><span>{String(currentIndex + 1).padStart(2, '0')} / {chapter.sections.length} · {chapter.sections[currentIndex]?.title}</span><div><button aria-label="Sección anterior" disabled={currentIndex <= 0} onClick={() => go(chapter.sections[currentIndex - 1].id)}><ArrowLeft size={15} /></button><button aria-label="Sección siguiente" disabled={currentIndex >= chapter.sections.length - 1} onClick={() => go(chapter.sections[currentIndex + 1].id)}><ArrowRight size={15} /></button></div></div>
    {selection && !context && !readOnly && <div className="selection-toolbar" onMouseDown={event => event.preventDefault()} role="toolbar" aria-label="Acciones para el texto seleccionado"><Button size="sm" onClick={() => ask(selection)}><Sparkles size={16} />Preguntar sobre esto</Button><Button size="sm" variant="outline" onClick={() => ask(selection, 'reframe')}>No entiendo el enfoque</Button><Button size="icon" variant="ghost" aria-label="Descartar selección" onClick={() => setSelection(null)}><X size={16} /></Button></div>}
    {notice && <div className="notice" role="status">{notice}<button aria-label="Cerrar aviso" onClick={() => setNotice('')}><X size={14} /></button></div>}
    <Dialog open={!!context} onOpenChange={open => { if (!open) closeTutor(); }}><DialogContent onCloseAutoFocus={event => { event.preventDefault(); dialogTrigger.current?.focus(); }}>
      <div className="dialog-eyebrow"><Sparkles size={17} /> Tutor contextual</div><DialogTitle>{mode === 'reframe' ? 'Vamos a verlo de otra manera.' : 'Hagamos espacio para la duda.'}</DialogTitle><DialogDescription>Una conversación sobre este fragmento. Puedes guardar la respuesta como nota.</DialogDescription>
      <blockquote className="selected-quote">{context?.text}</blockquote>
      <div className="tutor-controls"><label>Proveedor<select value={provider} onChange={e => setProvider(e.target.value)} disabled={busy}><option value="codex">Codex</option><option value="claude">Claude</option></select></label><label>Lo que necesito<select value={mode} onChange={e => setMode(e.target.value)} disabled={busy}><option value="explain">Resolver una duda</option><option value="reframe">Otra forma de explicarlo</option></select></label></div>
      <div className="conversation" aria-live="polite">{history.map((item, i) => <div key={i}><p className="conversation-question">{item.question}</p><p className="conversation-answer">{item.answer}</p></div>)}{busy && <p className="thinking"><span className="pulse-dot" /> El tutor está preparando una respuesta…</p>}</div>
      {error && <p className="error" role="alert">{error}</p>}
      <form onSubmit={send}><label className="sr-only" htmlFor="question">Tu pregunta</label><textarea id="question" value={question} onChange={e => setQuestion(e.target.value)} placeholder={history.length ? '¿Y si…? Continúa la conversación.' : '¿Qué parte no está clara?'} required maxLength={2000} rows={3} disabled={busy} /><div className="dialog-actions"><span className="small muted">Se envían este contexto y tu pregunta al proveedor elegido.</span><Button disabled={busy || !question.trim()}>{busy ? 'Consultando…' : 'Preguntar'}<ArrowRight size={15} /></Button></div></form>
      {history.length > 0 && <Button variant="outline" onClick={pin} disabled={pinned}><Pin size={15} />{pinned ? 'Guardado en tu cuaderno' : 'Anclar última respuesta'}</Button>}
    </DialogContent></Dialog>
    <Dialog open={settings} onOpenChange={setSettings}><DialogContent className="settings-dialog" onCloseAutoFocus={restorePanelFocus}><div className="dialog-eyebrow"><Settings2 size={17} /> A tu manera</div><DialogTitle>Haz cómoda la lectura.</DialogTitle><DialogDescription>Estos ajustes se guardan en este dispositivo.</DialogDescription>
      <fieldset><legend>Ambiente</legend><div className="theme-options">{[['light', 'Claro'], ['warm', 'Papel'], ['dark', 'Noche']].map(([value, label]) => <button key={value} className={`theme-option theme-${value}`} aria-pressed={prefs.theme === value} onClick={() => setPrefs(p => ({ ...p, theme: value }))}><span>Aa</span>{label}{prefs.theme === value && <Check size={14} />}</button>)}</div></fieldset>
      <label className="setting-row">Tamaño del texto<select value={prefs.size} onChange={e => setPrefs(p => ({ ...p, size: Number(e.target.value) }))}>{[17, 19, 21, 23].map(size => <option key={size} value={size}>{size} px</option>)}</select></label>
      <label className="setting-row">Ancho de lectura<select value={prefs.width} onChange={e => setPrefs(p => ({ ...p, width: e.target.value }))}><option value="normal">Concentrado</option><option value="wide">Amplio</option></select></label>
      <label className="setting-row">Tipografía<select value={prefs.serif ? 'serif' : 'sans'} onChange={e => setPrefs(p => ({ ...p, serif: e.target.value === 'serif' }))}><option value="sans">Sin serifas</option><option value="serif">Con serifas</option></select></label>
    </DialogContent></Dialog>
    <Dialog open={navigation} onOpenChange={setNavigation}><DialogContent className="navigation-dialog" onCloseAutoFocus={restorePanelFocus}><DialogTitle className="sr-only">Tu recorrido</DialogTitle><DialogDescription className="sr-only">Capítulos y secciones del curso Docker.</DialogDescription>{nav}</DialogContent></Dialog>
    <Dialog open={notebook} onOpenChange={setNotebook}><DialogContent className="notebook-dialog" onCloseAutoFocus={restorePanelFocus}><DialogTitle className="sr-only">Mi cuaderno</DialogTitle><DialogDescription className="sr-only">Notas vinculadas a tus lecturas.</DialogDescription>{notes}</DialogContent></Dialog>
  </div>;
}
