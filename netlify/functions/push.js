exports.handler = async function(event) {
  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ alive: true, method: event.httpMethod }),
  };
};
