const getHamming = (ref, target) => {
  let xor = BigInt('0x' + ref) ^ BigInt('0x' + target), count = 0
  // run popcount
  while (xor) { xor &= xor - 1n; count++ }
  return count
}