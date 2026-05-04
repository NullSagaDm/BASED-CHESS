// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ERC721URIStorage, ERC721} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract BasedChessResults is ERC721URIStorage, EIP712, Ownable, ReentrancyGuard {
    enum Result {
        Win,
        Loss,
        Draw
    }

    enum Difficulty {
        Easy,
        Medium,
        Hard,
        VeryHard
    }

    enum Rarity {
        Common,
        Rare,
        Epic,
        Legendary
    }

    struct MintData {
        uint8 result;
        uint8 difficulty;
        uint8 rarity;
        uint16 moveCount;
        uint32 durationSeconds;
        bytes32 seasonHash;
        uint64 playedAt;
        uint64 deadline;
    }

    bytes32 public constant MINT_DATA_TYPEHASH = keccak256(
        "MintData(uint8 result,uint8 difficulty,uint8 rarity,uint16 moveCount,uint32 durationSeconds,bytes32 seasonHash,uint64 playedAt,uint64 deadline)"
    );
    bytes32 public constant MINT_AUTHORIZATION_TYPEHASH = keccak256(
        "MintAuthorization(address to,bytes32 gameIdHash,bytes32 tokenUriHash,MintData data)MintData(uint8 result,uint8 difficulty,uint8 rarity,uint16 moveCount,uint32 durationSeconds,bytes32 seasonHash,uint64 playedAt,uint64 deadline)"
    );

    address public mintSigner;
    uint256 public nextTokenId = 1;

    mapping(bytes32 gameIdHash => uint256 tokenId) public tokenByGameIdHash;
    mapping(uint256 tokenId => bytes32 gameIdHash) public gameIdHashByToken;

    error GameAlreadyMinted(bytes32 gameIdHash);
    error InvalidMintSignature();
    error MintExpired();
    error RecipientMustMint();
    error InvalidMintSigner();

    event MintSignerUpdated(address indexed signer);
    event ResultMinted(
        address indexed to,
        bytes32 indexed gameIdHash,
        uint256 indexed tokenId,
        uint8 result,
        uint8 difficulty,
        uint8 rarity,
        uint16 moveCount,
        uint32 durationSeconds,
        bytes32 seasonHash,
        uint64 playedAt,
        string tokenUri
    );

    constructor(address initialOwner, address initialMintSigner)
        ERC721("Based Chess Results", "BCHESS")
        EIP712("BasedChessResults", "1")
        Ownable(initialOwner)
    {
        if (initialMintSigner == address(0)) revert InvalidMintSigner();
        mintSigner = initialMintSigner;
        emit MintSignerUpdated(initialMintSigner);
    }

    function setMintSigner(address newMintSigner) external onlyOwner {
        if (newMintSigner == address(0)) revert InvalidMintSigner();
        mintSigner = newMintSigner;
        emit MintSignerUpdated(newMintSigner);
    }

    function mintResult(address to, bytes32 gameIdHash, string calldata tokenUri, MintData calldata data, bytes calldata signature)
        external
        nonReentrant
        returns (uint256 tokenId)
    {
        if (block.timestamp > data.deadline) revert MintExpired();
        if (to != msg.sender) revert RecipientMustMint();
        if (tokenByGameIdHash[gameIdHash] != 0) revert GameAlreadyMinted(gameIdHash);

        bytes32 digest = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    MINT_AUTHORIZATION_TYPEHASH,
                    to,
                    gameIdHash,
                    keccak256(bytes(tokenUri)),
                    _hashMintData(data)
                )
            )
        );

        if (ECDSA.recover(digest, signature) != mintSigner) revert InvalidMintSignature();

        tokenId = nextTokenId;
        nextTokenId += 1;
        tokenByGameIdHash[gameIdHash] = tokenId;
        gameIdHashByToken[tokenId] = gameIdHash;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenUri);

        emit ResultMinted(
            to,
            gameIdHash,
            tokenId,
            data.result,
            data.difficulty,
            data.rarity,
            data.moveCount,
            data.durationSeconds,
            data.seasonHash,
            data.playedAt,
            tokenUri
        );
    }

    function hasMintedGame(bytes32 gameIdHash) external view returns (bool) {
        return tokenByGameIdHash[gameIdHash] != 0;
    }

    function _hashMintData(MintData calldata data) internal pure returns (bytes32) {
        return keccak256(
            abi.encode(
                MINT_DATA_TYPEHASH,
                data.result,
                data.difficulty,
                data.rarity,
                data.moveCount,
                data.durationSeconds,
                data.seasonHash,
                data.playedAt,
                data.deadline
            )
        );
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
