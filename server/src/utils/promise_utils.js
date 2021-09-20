async function wrapTryCatch(promise) {
  if(!(promise instanceof Promise))
    return new Error("Can't resolve non promise value");
  
  try {
    const resolved = await promise;

    return [resolved, null];
  } catch(err) {
    return [null, err];
  }
}

module.exports = {wrapTryCatch};