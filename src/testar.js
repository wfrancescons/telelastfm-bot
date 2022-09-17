const funcaoteste = () => {
  return new Promise((resolve, reject) => {
    reject({ code: 'ZERO_SCROBBLES', message: 'User has no scrobbles' });
  });
};

funcaoteste().catch((err) => console.error(err));
