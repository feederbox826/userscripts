const callGQL = async (query, variables = {}) =>
  fetch("/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables })
  })
    .then((res) => res.json())
    .then((res) => res.data)