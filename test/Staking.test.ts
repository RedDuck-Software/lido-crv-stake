/* eslint-disable */

import {
  time,
  loadFixture,
  impersonateAccount,
  setNextBlockBaseFeePerGas,
  mine,
} from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

import {
  LidoCrvStaker__factory,
  StaderStaker__factory,
  LidoCrvStaker,
  StaderStaker,
  TestERC20__factory,
  ICurve,
  ICurve__factory,
  LidoCrvLpStaker,
  LidoCrvLpStaker__factory,
} from '../typechain-types';

import { BigNumber, Signer } from 'ethers';
import { Address } from 'hardhat-deploy/types';
import { JsonRpcProvider } from '@ethersproject/providers';

const ETHX_CONTRACT_ADDRESS = '0xA35b1B31Ce002FBF2058D22F30f95D405200A15b';
const ETH_STETH_CONTRACT_ADDRESS = '0x06325440D014e39736583c165C2963BA99fAf14E';
const STETH_CONTRACT_ADDRESS = '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84';
const CURVE_CONTRACT_ADDRESS = '0xDC24316b9AE028F1497c275EB9192a3Ea0f67022';
const STAKED_LP_TOKENS = '0x182B723a58739a9c974cFDB385ceaDb237453c28';

const IMPERSONATE_ADDRESS = '0x73AF3bcf944a6559933396c1577B257e2054D935';

async function getErc20(impersonatedSigner: Signer, address: string) {
  return new ethers.Contract(
    address,
    TestERC20__factory.abi,
    impersonatedSigner,
  );
}

describe('Staking flow test', function () {
  let lidoCrvLpStaker: LidoCrvLpStaker;
  let lidoCrvStaker: LidoCrvStaker;
  let stagerStaker: StaderStaker;
  let impersonatedSigner: Signer;
  let curve: any;
  let provider: JsonRpcProvider;
  beforeEach(async () => {
    await impersonateAccount(IMPERSONATE_ADDRESS);

    impersonatedSigner = await ethers.getSigner(IMPERSONATE_ADDRESS);
    provider = ethers.provider;

    lidoCrvLpStaker = await new LidoCrvLpStaker__factory(
      impersonatedSigner,
    ).deploy();
    curve = new ethers.Contract(
      CURVE_CONTRACT_ADDRESS,
      ICurve__factory.abi,
      impersonatedSigner,
    );
    stagerStaker = await new StaderStaker__factory(impersonatedSigner).deploy();
    lidoCrvStaker = await new LidoCrvStaker__factory(impersonatedSigner).deploy();

    await lidoCrvLpStaker.initialize();
    await stagerStaker.initialize();
  });

  it.only('Allows to stake ETH -> stETH -> steCRV', async function () {
    const randomNumbers = [
      0.00001, 0.00002, 1, 2, 1.5, 1.6, 2.1, 2.2, 20, 21, 0.01, 0.02, 0.001,
      0.002, 0.0001, 0.0002,
    ];
    this.timeout(60000);

    await Promise.all(
      randomNumbers.map(async (n) => {
        const tx = await impersonatedSigner.sendTransaction({
          to: lidoCrvStaker.address,
          value: ethers.utils.parseEther(n.toString()),
          gasLimit: 300000000,
        });
        await tx.wait();
        const contractEthBalance = await provider.getBalance(lidoCrvLpStaker.address);
        expect(contractEthBalance).to.be.eq(0)

        await expect(
          parseFloat(
            ethers.utils.formatEther(
              await (
                await getErc20(impersonatedSigner, STETH_CONTRACT_ADDRESS)
              ).balanceOf(lidoCrvStaker.address),
            ),
          ),
        ).to.be.lessThanOrEqual(1);

        await expect(
          parseFloat(
            ethers.utils.formatEther(
              await (
                await getErc20(impersonatedSigner, ETH_STETH_CONTRACT_ADDRESS)
              ).balanceOf(lidoCrvStaker.address),
            ),
          ),
        ).to.be.eq(0);
      }),
    );
    await expect(
      impersonatedSigner.sendTransaction({
        to: lidoCrvStaker.address,
        value: 0,
        gasLimit: 300000000,
      }),
    ).to.be.revertedWith('!depositEthAmount ');
  });

  it('It allows to stake ETH -> stETH -> steCRV -> Lp', async function () {
    const amountsToDeposit = [
      0.001, 0.002, 0.01, 0.02, 1.1, 1.2, 2.1, 2.2, 3, 4, 10, 21, 100, 201,
    ];

    this.timeout(80000);
    for (let i = 0; i < amountsToDeposit.length; i++) {
      const depositEthAmount = amountsToDeposit[i] / 2;
      const depositStEthAmount = amountsToDeposit[i] / 2;
      const userStakedLpBalanceBefore = await (
        await getErc20(impersonatedSigner, STAKED_LP_TOKENS)
      ).balanceOf(await impersonatedSigner.getAddress());
      
      const contractStEthBalanceBefore = await (
        await getErc20(impersonatedSigner, STETH_CONTRACT_ADDRESS)
      ).balanceOf(await lidoCrvLpStaker.address);

      const receiveLpAmount = await curve.calc_token_amount(
        [
          ethers.utils.parseEther(depositEthAmount.toString()),
          ethers.utils.parseEther(depositStEthAmount.toString()),
        ],
        true,
      );

      const tx = await impersonatedSigner.sendTransaction({
        to: lidoCrvLpStaker.address,
        value: ethers.utils.parseEther(amountsToDeposit[i].toString()),
      });
      await tx.wait();

      const userStakedLpBalanceAfter = await (
        await getErc20(impersonatedSigner, STAKED_LP_TOKENS)
      ).balanceOf(await impersonatedSigner.getAddress());

      const contractStakedLpBalanceAfter = await (
        await getErc20(impersonatedSigner, STAKED_LP_TOKENS)
      ).balanceOf(await lidoCrvLpStaker.address);

      const contractLpBalanceAfter = await (
        await getErc20(impersonatedSigner, ETH_STETH_CONTRACT_ADDRESS)
      ).balanceOf(await lidoCrvLpStaker.address);
      
      const contractStEthBalanceAfter = await (
        await getErc20(impersonatedSigner, STETH_CONTRACT_ADDRESS)
      ).balanceOf(await lidoCrvLpStaker.address);

      const contractEthBalance = await provider.getBalance(lidoCrvLpStaker.address);

      expect(receiveLpAmount).closeTo(
        userStakedLpBalanceAfter.sub(userStakedLpBalanceBefore),
        10 ** 14,
      );

      expect(contractStakedLpBalanceAfter).to.be.eq(0);

      expect(contractLpBalanceAfter).to.be.eq(0);

      expect(contractEthBalance).to.be.eq(0)

      expect(contractStEthBalanceAfter.sub(contractStEthBalanceBefore)).to.be.lessThanOrEqual(1)
    }
  });

  it('Allows to stake at stager', async function () {
    const amountToSend = 1;
    const formattedAmountToSend = ethers.utils.parseEther(
      amountToSend.toString(),
    );

    const tx = await impersonatedSigner.sendTransaction({
      to: stagerStaker.address,
      value: formattedAmountToSend,
    });

    await tx.wait();

    const contract = new ethers.Contract(
      ETHX_CONTRACT_ADDRESS,
      TestERC20__factory.abi,
      impersonatedSigner,
    );
    console.log(
      +parseFloat(
        ethers.utils.formatEther(
          await contract.balanceOf(await impersonatedSigner.getAddress()),
        ),
      ),
    );
    expect(
      +parseFloat(
        ethers.utils.formatEther(
          await contract.balanceOf(await impersonatedSigner.getAddress()),
        ),
      ).toFixed(2),
    ).to.be.greaterThanOrEqual(amountToSend - 0.02); //gas fee
  });
});
