// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface ICurv{ 
    function add_liquidity(uint256[2] calldata amounts,uint256 min_mint_amount) external payable returns(uint256);   

    function lp_token() external view returns(address);

}

contract LidoCrvStaker is Ownable{
    address constant public lido = 0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84;
    address constant public crv = 0xDC24316b9AE028F1497c275EB9192a3Ea0f67022;
    uint256 slippageCoeficient = 99;

    function setCoeficient(uint256 _slippageCoeficient) external onlyOwner{
        slippageCoeficient = _slippageCoeficient;
    }

    receive() external payable {
        uint256 depositEthAmount =  msg.value / 2;

        bytes memory submitData = abi.encodeWithSignature("submit(address)", 0x0000000000000000000000000000000000000000);
        (bool lidoSuccess, bytes memory lidoResult) = lido.call{value: depositEthAmount}(submitData);
        require(lidoSuccess, "Lido submit function failed");

        uint256 stEthAmount = abi.decode(lidoResult,(uint256));
        bytes memory calcTokenAmount = abi.encodeWithSignature("calc_token_amount(uint256[2],bool)", [depositEthAmount, stEthAmount],true);

        (bool crvCalcSuccess, bytes memory crvResult) = crv.call(calcTokenAmount);
        require(crvCalcSuccess, "Crv calc_token_amount failed");

        uint256 slippage = abi.decode(crvResult,(uint256)) * 99 / 100;

        bytes memory approveStEth = abi.encodeWithSignature("approve(address,uint256)", crv, type(uint).max);
        (bool stEthapproveSuccess,) = lido.call(approveStEth);
        require(stEthapproveSuccess, "StEth approve failed");
        
        uint256 depositEthAmountCopy = depositEthAmount;
        uint256 res = ICurv(crv).add_liquidity{value:depositEthAmount}([depositEthAmountCopy, stEthAmount],slippage);
        address lp_token = ICurv(crv).lp_token();

        bytes memory transferSteCrv = abi.encodeWithSignature("transfer(address,uint256)", msg.sender, res);
        (bool transferSuccess,) = lp_token.call(transferSteCrv);
        require(transferSuccess, "StEth approve failed");
        
    }
}





        // bytes memory balanceOf = abi.encodeWithSignature("balanceOf(address)", address(this));        
        // (bool balof,bytes memory resData) = lido.call(balanceOf);
        // uint256 balanceOfData = abi.decode(resData,(uint256));

        // console.log("balanceOfData",balanceOfData);
        //         console.log("balance",address(this).balance