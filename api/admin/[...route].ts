/**
 * Thin re-export: единственный источник логики — `api/admin-router.ts`.
 * Не добавляй handler-логику сюда — иначе снова появится рассинхрон с rewrite-путём.
 */
export {default} from '../admin-router.js'
