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
 * Retorna a lista completa de membros familiares ativos, garantindo que
 * o Titular (Owner) sempre esteja presente como o primeiro elemento da lista.
 */
export function getFamilyMemberList(user?: UserProfile | null, familyMembers?: FamilyMember[]): FamilyMember[] {
  const members = Array.isArray(familyMembers) ? familyMembers : [];

  const ownerName = user?.name?.trim() || 'Titular';
  const ownerEmail = user?.email || '';

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

  const otherMembers = members.filter(m => m.id !== ownerMember.id && !m.isOwner);

  return [ownerMember, ...otherMembers];
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
