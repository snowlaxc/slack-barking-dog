/**
 * Generates a random barking string.
 * The string consists of "월" (Woof) and punctuation marks.
 * The total length is guaranteed to be less than 300 characters.
 */
function generateBark() {
  const barks = ["월", "멍", "왈", "크르릉", "우워월"];
  const punctuations = ["!", "!!", "!!!", "...", "..", "!!!!", "?", "!?"];

  let result = "";
  // Random length between 20 and 100 characters roughly, but we construct it by parts
  const targetLength = Math.floor(Math.random() * 200) + 50; // 50 to 250 chars

  while (result.length < targetLength) {
    const bark = barks[Math.floor(Math.random() * barks.length)];
    const punct = punctuations[Math.floor(Math.random() * punctuations.length)];
    const part = bark + punct + " ";

    if (result.length + part.length > 290) {
      break;
    }

    result += part;
  }

  return result.trim();
}

module.exports = { generateBark };
