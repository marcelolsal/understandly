// @ts-nocheck -- DOM harness supplies browser globals for component interaction tests.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';
import React from 'react';

const window = new Window({ url: 'http://localhost:4321' });
for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'Element', 'Node', 'NodeFilter', 'HTMLInputElement', 'HTMLTextAreaElement', 'HTMLSelectElement', 'MutationObserver', 'CustomEvent', 'Event', 'EventTarget', 'KeyboardEvent', 'MouseEvent', 'FocusEvent', 'getComputedStyle', 'localStorage', 'requestAnimationFrame', 'cancelAnimationFrame']) {
  const value = window[key];
  Object.defineProperty(globalThis, key, { value: typeof value === 'function' && ['getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame'].includes(key) ? value.bind(window) : value, configurable: true, writable: true });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.IntersectionObserver = class { observe() {} disconnect() {} };
globalThis.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} });
window.HTMLElement.prototype.scrollIntoView = function () {};
window.scrollTo = () => {};
const { render, screen, fireEvent, waitFor, cleanup } = await import('@testing-library/react');
const { default: userEvent } = await import('@testing-library/user-event');
const { default: Study } = await import('../src/components/Study.tsx');

const chapter = { id: 'test', title: 'Fictional course', revision: 1, version: 'fictional-version', approved: true, readingMinutes: 3,
  sections: [{ id: 'concept', title: 'A concept', parts: [{ type: 'html', html: '<p>Fictional concept to study.</p>' },
    { type: 'exercise', id: 'concept-1', label: 'Feedback for concept', html: '<p>Fictional feedback, visible after attempting.</p>' }] }] };

test('study UI saves before revealing feedback; tutor reply can be pinned and preferences survive remount', async () => {
  let state = { notes: [], attempts: [], position: null };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (path, options) => {
    const data = JSON.parse(options.body);
    if (path === '/api/tutor') return new Response(JSON.stringify({ answer: 'Fictional tutor answer.', provider: 'codex' }), { status: 200 });
    if (data.type === 'attempt') state.attempts.push({ ...data, id: 'attempt', createdAt: new Date().toISOString() });
    if (data.type === 'note') state.notes.push({ ...data, id: 'note', createdAt: new Date().toISOString() });
    return new Response(JSON.stringify(state), { status: 200 });
  };
  try {
    const user = userEvent.setup({ document: window.document });
    render(<Study chapter={chapter} initialState={state} />);
    assert.equal(screen.queryByText('Fictional feedback, visible after attempting.'), null);
    await user.type(screen.getByLabelText('Explica tu razonamiento antes de consultar el feedback.'), 'My first attempt.');
    await user.click(screen.getByRole('button', { name: /Guardar intento y ver feedback/ }));
    await screen.findByText('Fictional feedback, visible after attempting.');
    assert.equal(state.attempts[0].answer, 'My first attempt.');
    await user.click(screen.getByRole('button', { name: 'Preguntar sobre A concept' }));
    await screen.findByRole('dialog');
    await user.type(screen.getByLabelText('Tu pregunta'), 'What does this mean?');
    await user.click(screen.getByRole('button', { name: 'Preguntar', exact: true }));
    await screen.findByText('Fictional tutor answer.');
    await user.click(screen.getByRole('button', { name: 'Anclar última respuesta' }));
    await screen.findByRole('button', { name: 'Guardado en tu cuaderno' });
    assert.equal(state.notes[0].question, 'What does this mean?');
    await user.click(screen.getByRole('button', { name: 'Cerrar', exact: true }));
    await waitFor(() => assert.equal(screen.queryByRole('dialog'), null));
    await user.click(screen.getByRole('button', { name: 'Ajustar lectura' }));
    await screen.findByRole('dialog');
    fireEvent.change(screen.getByLabelText('Tamaño del texto'), { target: { value: '23' } });
    await waitFor(() => assert.equal(JSON.parse(localStorage.getItem('understandly-reading')).size, 23));
    cleanup();
    render(<Study chapter={chapter} initialState={state} />);
    await waitFor(() => assert.match(document.querySelector('.study-app').getAttribute('style'), /23px/));
    assert.equal(state.notes.length, 1);
  } finally { cleanup(); globalThis.fetch = originalFetch; window.happyDOM.cancelAsync(); }
});

test('a failed attempt save never reveals its solution or reports success', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ error: 'Fictional disk error.' }), { status: 500 });
  try {
    const user = userEvent.setup({ document: window.document });
    render(<Study chapter={chapter} initialState={{ notes: [], attempts: [], position: null }} />);
    await user.type(screen.getByLabelText('Explica tu razonamiento antes de consultar el feedback.'), 'An unsaved attempt.');
    await user.click(screen.getByRole('button', { name: /Guardar intento y ver feedback/ }));
    await screen.findByRole('alert');
    assert.equal(screen.queryByText('Fictional feedback, visible after attempting.'), null);
    assert.equal(screen.queryByText('1 intento guardado'), null);
  } finally { cleanup(); globalThis.fetch = originalFetch; window.happyDOM.cancelAsync(); }
});
