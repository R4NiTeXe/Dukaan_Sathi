module.exports = {
  randomString: () => Math.random().toString(36).substring(2, 10),
  randomNumber: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
};