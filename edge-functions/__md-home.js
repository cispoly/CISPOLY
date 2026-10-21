export default function onRequest() {
  return new Response('md-test-ok', { headers: { 'Content-Type': 'text/plain' } })
}
