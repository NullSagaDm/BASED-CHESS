export const resultNftAbi = [
  {
    type: "function",
    name: "mintResult",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "gameIdHash", type: "bytes32" },
      { name: "tokenUri", type: "string" },
      {
        name: "data",
        type: "tuple",
        components: [
          { name: "result", type: "uint8" },
          { name: "difficulty", type: "uint8" },
          { name: "rarity", type: "uint8" },
          { name: "moveCount", type: "uint16" },
          { name: "durationSeconds", type: "uint32" },
          { name: "seasonHash", type: "bytes32" },
          { name: "playedAt", type: "uint64" },
          { name: "deadline", type: "uint64" }
        ]
      },
      { name: "signature", type: "bytes" }
    ],
    outputs: [{ name: "tokenId", type: "uint256" }]
  },
  {
    type: "event",
    name: "ResultMinted",
    inputs: [
      { name: "to", type: "address", indexed: true },
      { name: "gameIdHash", type: "bytes32", indexed: true },
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "result", type: "uint8", indexed: false },
      { name: "difficulty", type: "uint8", indexed: false },
      { name: "rarity", type: "uint8", indexed: false },
      { name: "moveCount", type: "uint16", indexed: false },
      { name: "durationSeconds", type: "uint32", indexed: false },
      { name: "seasonHash", type: "bytes32", indexed: false },
      { name: "playedAt", type: "uint64", indexed: false },
      { name: "tokenUri", type: "string", indexed: false }
    ]
  }
] as const;

export const resultEnum = { win: 0, loss: 1, draw: 2 } as const;
export const difficultyEnum = { easy: 0, medium: 1, hard: 2, "very-hard": 3 } as const;
export const rarityEnum = { common: 0, rare: 1, epic: 2, legendary: 3 } as const;
