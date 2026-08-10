/**
 * Thin re-export: единственный источник логики — `api/member-router.ts`.
 * Не добавляй handler-логику сюда — иначе снова появится рассинхрон с rewrite-путём.
 */
export {default} from '../member-router.js'
