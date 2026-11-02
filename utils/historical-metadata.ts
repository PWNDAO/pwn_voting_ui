// Exact mainnet metadata URIs recovered from the 7 Stewards and 2 Community
// ProposalCreated events. Their original content could not be recovered.
// Skip automatic gateway requests for these only; a detail-page retry can still
// fetch them if someone re-pins the content. New proposals are unaffected.
export const UNAVAILABLE_HISTORICAL_METADATA = [
  "ipfs://bafkreihxeuyy4p3uuc7hmds3y6hyjeulqwjghbgtv55hrlywudo52r26nm",
  "ipfs://bafkreico256yvxbsij5whgq2frosh3ptd2x45nb5v3reucazw4cbwowe5a",
  "ipfs://bafkreigomtko2jqi6amz3kmovtct5sxlo7v5qfom2k4zvxnaqrn3ikwypm",
  "ipfs://bafkreic6lbtymdqt3yuge7ipf6l6ovmbop65jnge32epnbdjuwkh7mmrwe",
  "ipfs://bafkreiczkl53y7u2m7gl3zunvyg7c7pxvfi5rmkrvnfvas5x6yocdhzh2m",
  "ipfs://bafkreibpxoyajmmphfl4bvcl2423nkq3oq6mw7les5akiu7gg4ggwtwcje",
  "ipfs://bafkreieu4quuamtucnlczjydhkpweuwdzwxuczvv4o5igskji6h7j2madm",
  "ipfs://bafkreibq2i5px3yyymciyv6ck6ghvjpsmhh7hac5i4ibmnwlhtsrfbx6va",
  "ipfs://bafkreidptrvqjw62zh4jmuchrmkycfw6g44hhadmu46d7ydgcutxeosxe4",
] as const;

export function isUnavailableHistoricalMetadata(chainId: number, uri?: string): boolean {
  return chainId === 1 && UNAVAILABLE_HISTORICAL_METADATA.some((knownUri) => knownUri === uri);
}
