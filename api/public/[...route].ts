/**
 * Thin re-export: единственный источник логики — `api/public-router.ts`.
 * Не добавляй handler-логику сюда — иначе снова появится рассинхрон с rewrite-путём.
 */
export {default} from '../public-router.js'
