import { FamilyMember, UserProfile } from '../types';

/**
 * Formata o nome do membro familiar para exibição compacta e limpa:
 * Se tiver 1 palavra: "Liverton"
 * Se tiver 2 ou mais palavras: "Liverton Aguiar" (primeiro e último nome)
 */
export function formatMemberDisplayName(fullName?: string): string {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1]}`;
}

/**
 * Deduplica e limpa um array de membros familiares, removendo entradas repetidas
 * por ID, e-mail normalizado ou nome (para dependentes não vinculados).
 */
export function deduplicateFamilyMembers(
  members: FamilyMember[] | undefined | null,
  ownerEmail?: string | null
): FamilyMember[] {
  if (!Array.isArray(members) || members.length === 0) return [];

  const cleanOwnerEmail = ownerEmail?.trim().toLowerCase() || '';
  const seenIds = new Set<string>();
  const seenEmails = new Set<string>();
  const seenNames = new Set<string>();
  const result: FamilyMember[] = [];

  for (const rawMember of members) {
    if (!rawMember || !rawMember.id) continue;

    const memberId = rawMember.id.trim();
    const cleanEmail = rawMember.email?.trim().toLowerCase() || '';
    const cleanName = rawMember.name?.trim().toLowerCase() || '';

    // Se o membro tiver o mesmo e-mail do titular e não for o registro de owner oficial, ignora
    if (cleanOwnerEmail && cleanEmail && cleanEmail === cleanOwnerEmail && !rawMember.isOwner && memberId !== 'owner' && memberId !== 'mem-owner') {
      continue;
    }

    // Se o ID já foi visto, é duplicata exata
    if (seenIds.has(memberId)) {
      continue;
    }

    // Se tem e-mail e esse e-mail já foi registrado no grupo, é duplicata de convite/cadastro
    if (cleanEmail && seenEmails.has(cleanEmail)) {
      continue;
    }

    // Para dependentes sem e-mail (ou e-mails genéricos/iguais ao nome), deduplicar pelo nome
    if (!cleanEmail && cleanName && seenNames.has(cleanName)) {
      continue;
    }

    seenIds.add(memberId);
    if (cleanEmail) seenEmails.add(cleanEmail);
    if (cleanName) seenNames.add(cleanName);

    result.push(rawMember);
  }

  return result;
}

/**
 * Retorna a lista completa de membros familiares ativos, garantindo que
 * o Titular (Owner) sempre esteja presente como o primeiro elemento da lista
 * e que nenhum dependente ou convidado apareça em duplicidade.
 */
export function getFamilyMemberList(user?: UserProfile | null, familyMembers?: FamilyMember[]): FamilyMember[] {
  const members = Array.isArray(familyMembers) ? familyMembers : [];

  const ownerName = user?.name?.trim() || 'Titular';
  const ownerEmail = user?.email?.trim().toLowerCase() || '';

  // Verificar se o titular já está cadastrado em familyMembers
  const existingOwner = members.find(m => m.isOwner || m.id === 'owner' || m.id === 'mem-owner');

  const ownerMember: FamilyMember = existingOwner
    ? {
        ...existingOwner,
        name: existingOwner.name || ownerName,
        email: existingOwner.email || ownerEmail,
        isOwner: true,
      }
    : {
        id: 'owner',
        name: ownerName,
        email: ownerEmail,
        phone: user?.phone || '',
        role: 'admin',
        status: 'active',
        isOwner: true,
        type: 'linked',
        joinedAt: '2026-01-01',
      };

  // Filtrar todos que não sejam o titular
  const rawOtherMembers = members.filter(m => m.id !== ownerMember.id && !m.isOwner);

  // Aplicar deduplicação rigorosa nos outros membros
  const deduplicatedOthers = deduplicateFamilyMembers(rawOtherMembers, ownerEmail);

  return [ownerMember, ...deduplicatedOthers];
}

/**
 * Retorna o nome formatado do membro responsável a partir do seu ID.
 */
export function getMemberDisplayNameById(
  memberId: string | undefined,
  allMembers: FamilyMember[],
  fallbackName = 'Titular'
): string {
  if (!memberId || memberId === 'owner' || memberId === 'mem-owner') {
    const owner = allMembers.find(m => m.isOwner);
    return formatMemberDisplayName(owner?.name || fallbackName);
  }

  const found = allMembers.find(m => m.id === memberId);
  if (found) {
    return formatMemberDisplayName(found.name);
  }

  return formatMemberDisplayName(fallbackName);
}
