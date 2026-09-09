import { uploadProxy } from '../../utils/uploadProxy';

export default defineEventHandler(event => {
  const base = String(useRuntimeConfig(event).uploadApiBase).replace(/\/$/, '');
  const path = (event.node.req.url || '').replace(/^\/up(?=\/|\?|$)/, '');
  return uploadProxy(event.node.req, event.node.res, new URL(`${base}${path}`));
});
