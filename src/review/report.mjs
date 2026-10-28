const clean = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const quote = value => clean(value).split('\n').map(line => `> ${line}`).join('\n');

export function formatProgress(event) {
  const plain = value => String(value ?? '').replace(/[\x00-\x08\x0b-\x1f\x7f]/g, '');
  const prefix = `${event.round ? `Ronda ${event.round} · ` : ''}${event.provider === 'codex' ? 'Codex' : event.provider === 'claude' ? 'Claude' : 'Coordinador'}`;
  if (event.status === 'running') return `${prefix}: revisando el capítulo…`;
  if (event.status === 'failed') return `${prefix}: no pudo revisar (${event.code}).`;
  if (event.status === 'completed') {
    const lines = [`${prefix}: ${event.verdict === 'approved' ? 'aprobado' : 'pide cambios'}.`, plain(event.summary)];
    for (const issue of event.issues ?? []) lines.push(
      `  ${issue.severity === 'blocking' ? 'Obligatorio' : 'Sugerencia'} · ${plain(issue.section)}: ${plain(issue.problem)}`,
      `  Propuesta: ${plain(issue.proposedChange)}`);
    return lines.join('\n');
  }
  const lines = [`${prefix}: ${plain(event.message ?? event.status)}`];
  for (const change of event.changes ?? []) lines.push(`  ${plain(change.section)}: ${plain(change.reason)}`);
  return lines.join('\n');
}

export function renderReviewReport(manifest) {
  const lines = ['# Resultado de la revisión', '', `Estado: **${manifest.status}**.`,
    `Aprobación conjunta: **${manifest.approved ? 'sí' : 'no'}**.`, '',
    `Versión del contenido: \`${manifest.contentSha256}\`.`, '',
    'Este informe evalúa el manuscrito y las evidencias proporcionadas; no demuestra aprendizaje del estudiante.', ''];
  for (const provider of ['codex', 'claude']) {
    const record = manifest.reviews[provider];
    lines.push(`## ${provider === 'codex' ? 'Codex' : 'Claude'}`, '');
    if (record?.status !== 'completed') {
      lines.push(`Sin dictamen válido. Código: ${record?.code ?? 'PENDING'}.`, '');
      continue;
    }
    lines.push(`Dictamen: **${record.review.verdict}**.`, '', quote(record.review.summary), '');
    for (const issue of record.review.issues) {
      lines.push(`### ${issue.severity === 'blocking' ? 'Cambio obligatorio' : 'Sugerencia'}`, '',
        '**Sección:**', quote(issue.section), '', '**Qué ocurre:**', quote(issue.problem), '',
        '**Cómo propone resolverlo:**', quote(issue.proposedChange), '');
    }
    for (const criterion of record.review.criteria.filter(c => c.status !== 'pass'))
      lines.push(`**Criterio pendiente: ${criterion.id}**`, '', quote(criterion.reason), '');
  }
  return lines.join('\n') + '\n';
}

export function renderCycleReport(cycle) {
  const lines = ['# Revisión y corrección automática', '', `Estado: **${cycle.status}**.`,
    `Aprobado por ambos: **${cycle.approved ? 'sí' : 'no'}**.`, '', clean(cycle.reason ?? ''), '',
    `Rondas utilizadas: ${cycle.rounds.length} de ${cycle.maxRounds}.`, ''];
  for (const round of cycle.rounds) {
    lines.push(`## Ronda ${round.number}`, '', `Resultado: **${round.status}**.`, '');
    for (const provider of ['codex', 'claude']) {
      const review = round.reviews[provider];
      lines.push(`**${provider}: ${review?.review?.verdict ?? review?.code ?? 'pendiente'}**`, '');
      if (review?.review) {
        lines.push(quote(review.review.summary), '');
        for (const [i, issue] of review.review.issues.entries())
          lines.push(`**Observación ${provider}:${i + 1} (${issue.severity})**`, '',
            quote(`${issue.section}: ${issue.problem}`), '', '**Propuesta:**', quote(issue.proposedChange), '');
      }
    }
    if (round.correction) {
      lines.push('### Corrección aplicada', '', quote(round.correction.explanation), '');
      for (const change of round.correction.changes)
        lines.push('**Sección:**', quote(change.section), '', '**Antes:**', quote(change.before), '',
          '**Después:**', quote(change.after), '', '**Por qué:**', quote(change.reason), '',
          `Observaciones atendidas: ${change.addresses.map(clean).join(', ')}.`, '');
    }
  }
  return lines.join('\n') + '\n';
}
