const fetcher = (...args: Parameters<typeof fetch>): Promise<any> =>
  fetch(...args).then((res) => {
    if (!res.ok) {
      throw new Error(`Request failed with status ${res.status}`);
    }
    return res.json();
  });

export default fetcher;
