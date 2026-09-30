/**
 * Compatibility entrypoint kept for operators that still launch mailService.js.
 *
 * Recovery endpoints now live exclusively in apiServer.js so authentication,
 * rate limiting and code storage cannot drift into a second insecure service.
 */
console.warn('[DEPRECATED] mailService.js encaminha para a API principal do Finly.');
await import('./apiServer.js');
