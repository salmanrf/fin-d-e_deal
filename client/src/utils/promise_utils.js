export async function wrapTryCatch(promise) {
  if(!(promise instanceof Promise))
    return new Error("Promised was not passed");
  
  try {
    const resolved = await promise;

    return [resolved, null];
  } catch(err) {
    return [null, err];
  }
}