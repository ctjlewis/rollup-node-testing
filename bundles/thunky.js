var nextTick = nextTickArgs;
process.nextTick(upgrade, 42); // pass 42 and see if upgrade is called with it

function upgrade (val) {
  if (val === 42) nextTick = process.nextTick;
}

function nextTickArgs (fn, a, b) {
  process.nextTick(function () {
    fn(a, b);
  });
}
