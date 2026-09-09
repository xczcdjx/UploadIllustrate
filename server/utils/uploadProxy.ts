import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import type { IncomingMessage, ServerResponse } from 'node:http';

const hopHeaders = ['connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailer', 'transfer-encoding', 'upgrade'];
function forwardHeaders(headers: IncomingMessage['headers']) {
  const result = {...headers};
  for (const name of [...hopHeaders, ...(headers.connection || '').split(',').map(name => name.trim().toLowerCase())]) delete result[name];
  return result;
}

// Keep uploads streaming, but drain the client body before delivering an early
// rejection. Otherwise browsers can see a reset instead of the backend's JSON.
export function uploadProxy(req: IncomingMessage, res: ServerResponse, target: URL): Promise<void> {
  return new Promise(resolve => {
    let receivedResponse = false;
    let upstreamResponse: IncomingMessage | undefined;
    const upstream = (target.protocol === 'https:' ? httpsRequest : httpRequest)(target, {
      method: req.method,
      // Early rejection can leave an incomplete request body on the connection.
      // Do not reuse that socket for the next upload.
      agent: false,
      headers: {...forwardHeaders(req.headers), host: target.host},
    });
    const afterBody = (send: () => void) => {
      req.unpipe(upstream);
      if (req.readableEnded) send();
      else {
        req.once('end', send);
        req.resume();
      }
    };
    res.once('finish', resolve);
    res.once('close', () => {
      upstream.destroy();
      upstreamResponse?.destroy();
      resolve();
    });
    req.once('aborted', () => { upstream.destroy(); res.destroy(); });
    req.once('error', () => { upstream.destroy(); res.destroy(); });
    upstream.once('response', response => {
      receivedResponse = true;
      upstreamResponse = response;
      response.once('error', () => res.destroy());
      afterBody(() => {
        if (res.destroyed) return;
        res.writeHead(response.statusCode || 502, forwardHeaders(response.headers));
        response.pipe(res);
      });
      upstream.end();
    });
    upstream.once('error', () => {
      if (receivedResponse) return;
      afterBody(() => {
        if (res.destroyed) return;
        res.writeHead(502, {'content-type': 'application/json; charset=utf-8'});
        res.end(JSON.stringify({success: false, status: 502, msg: '上传服务暂时无法连接，请稍后重试'}));
      });
    });
    req.pipe(upstream);
  });
}
