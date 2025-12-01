const dns = require('dns').promises;
const net = require('net');

const host = 'db.ibrqvokojlfmuikmobde.supabase.co';
const port = 5432;

async function resolveAndCheck() {
  try {
    console.log('Resolving A records (IPv4)...');
    let a = [];
    try { a = await dns.resolve4(host); } catch (e) { console.log('  resolve4 error:', e.code || e.message); }
    console.log('  A records:', a);

    console.log('Resolving AAAA records (IPv6)...');
    let aaaa = [];
    try { aaaa = await dns.resolve6(host); } catch (e) { console.log('  resolve6 error:', e.code || e.message); }
    console.log('  AAAA records:', aaaa);

    const addresses = [];
    a.forEach(ip => addresses.push({ family: 4, ip }));
    aaaa.forEach(ip => addresses.push({ family: 6, ip }));

    if (addresses.length === 0) {
      console.error('No addresses found for host.');
      process.exitCode = 2;
      return;
    }

    for (const addr of addresses) {
      console.log(`Testing TCP connect to ${addr.ip} (IPv${addr.family}) on port ${port}...`);
      await tryConnect(addr.ip, port, 3000).then(() => {
        console.log(`  OK: Connected to ${addr.ip}:${port}`);
      }).catch(err => {
        console.log(`  FAIL: ${addr.ip}:${port} -> ${err.code || err.message}`);
      });
    }
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exitCode = 1;
  }
}

function tryConnect(ip, port, timeout = 3000) {
  return new Promise((resolve, reject) => {
    const sock = new net.Socket();
    let done = false;
    const onError = (err) => { if (done) return; done = true; sock.destroy(); reject(err); };
    sock.setTimeout(timeout, () => onError(new Error('timeout')));
    sock.once('error', onError);
    sock.once('timeout', onError);
    sock.connect({ host: ip, port }, () => {
      if (done) return;
      done = true;
      sock.end();
      resolve();
    });
  });
}

resolveAndCheck();
