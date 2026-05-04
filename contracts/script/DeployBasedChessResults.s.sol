// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script} from "forge-std/Script.sol";
import {BasedChessResults} from "../src/BasedChessResults.sol";

contract DeployBasedChessResults is Script {
    function run() external returns (BasedChessResults deployed) {
        address owner = vm.envAddress("CONTRACT_OWNER");
        address mintSigner = vm.envAddress("MINT_SIGNER_ADDRESS");

        vm.startBroadcast();
        deployed = new BasedChessResults(owner, mintSigner);
        vm.stopBroadcast();
    }
}
