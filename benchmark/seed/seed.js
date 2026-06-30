// benchmark/seed/seed.js
// MongoDB seed script for kotoba-press-core benchmarks.
// Run with: mongosh mongodb://localhost:27017/learning_japanese seed.js

const localDb = db.getSiblingDB("learning_japanese");

// ---------------------------------------------------------------------------
// Words collection
// ---------------------------------------------------------------------------
localDb.words.drop();

localDb.words.insertMany([
  {
    _id: "000000000000000000000001",
    kanji: [{ text: "食べる" }],
    readings: [{ text: "たべる" }],
    senses: [{ pos: ["v1", "vt"], gloss: [{ text: "to eat", lang: "eng" }] }],
    jlpt: 5,
  },
  {
    _id: "000000000000000000000002",
    kanji: [{ text: "勉強" }],
    readings: [{ text: "べんきょう" }],
    senses: [{ pos: ["n", "vs"], gloss: [{ text: "study", lang: "eng" }] }],
    jlpt: 5,
  },
  {
    _id: "000000000000000000000003",
    kanji: [{ text: "経験" }],
    readings: [{ text: "けいけん" }],
    senses: [{ pos: ["n", "vs"], gloss: [{ text: "experience", lang: "eng" }] }],
    jlpt: 3,
  },
  {
    _id: "000000000000000000000004",
    kanji: [{ text: "挑戦" }],
    readings: [{ text: "ちょうせん" }],
    senses: [{ pos: ["n", "vs"], gloss: [{ text: "challenge", lang: "eng" }] }],
    jlpt: 2,
  },
  {
    _id: "000000000000000000000005",
    kanji: [{ text: "曖昧" }],
    readings: [{ text: "あいまい" }],
    senses: [{ pos: ["adj-na", "n"], gloss: [{ text: "ambiguous", lang: "eng" }] }],
    jlpt: 1,
  },
]);

print("✅  Inserted 5 words into 'words' collection.");

// ---------------------------------------------------------------------------
// Grammars collection
// ---------------------------------------------------------------------------
localDb.grammars.drop();

localDb.grammars.insertMany([
  {
    _id: "000000000000000000000011",
    pattern: "〜てもいい",
    formation: "Verb て-form + もいい",
    meaning: "It's okay to …; may I …",
    jlpt: 5,
    examples: [
      { japanese: "ここに座ってもいいですか。", reading: "ここにすわってもいいですか。", translation: "May I sit here?" },
      { japanese: "写真を撮ってもいいですよ。", reading: "しゃしんをとってもいいですよ。", translation: "It's okay to take photos." },
    ],
  },
  {
    _id: "000000000000000000000012",
    pattern: "〜ば〜ほど",
    formation: "Verb ば-form + Verb dictionary form + ほど",
    meaning: "The more … the more …",
    jlpt: 3,
    examples: [
      { japanese: "練習すればするほど上手になる。", reading: "れんしゅうすればするほどじょうずになる。", translation: "The more you practice, the better you get." },
    ],
  },
  {
    _id: "000000000000000000000013",
    pattern: "〜わけがない",
    formation: "Verb plain form + わけがない",
    meaning: "There's no way that …",
    jlpt: 2,
    examples: [
      { japanese: "彼がそんなことを言うわけがない。", reading: "かれがそんなことをいうわけがない。", translation: "There's no way he said such a thing." },
    ],
  },
]);

print("✅  Inserted 3 grammars into 'grammars' collection.");

// ---------------------------------------------------------------------------
// Users collection (benchmark user)
// ---------------------------------------------------------------------------
localDb.users.drop();

localDb.users.insertOne({
  _id: "000000000000000000000099",
  google_id: "bench-google-id",
  email: "bench@test.com",
  name: "Benchmark User",
  role: "user",
  created_at: new Date(),
});

print("✅  Inserted benchmark user into 'users' collection.");
print("🎉  Seed complete.");
