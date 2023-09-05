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
} from '../typechain-types';

import { BigNumber, Signer } from 'ethers';
import { Address } from 'hardhat-deploy/types';

const ETHX_CONTRACT_ADDRESS = '0xA35b1B31Ce002FBF2058D22F30f95D405200A15b';
const ETH_STETH_CONTRACT_ADDRESS = '0x06325440D014e39736583c165C2963BA99fAf14E';
const STETH_CONTRACT_ADDRESS = '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84';
const CURVE_CONTRACT_ADDRESS = '0xDC24316b9AE028F1497c275EB9192a3Ea0f67022';
const IMPERSONATE_ADDRESS = '0x73AF3bcf944a6559933396c1577B257e2054D935';

async function getErc20(impersonatedSigner: Signer, address: string) {
  return new ethers.Contract(
    address,
    TestERC20__factory.abi,
    impersonatedSigner,
  );
}

describe('Staking flow test', function () {
  let lidoCrvStaker: LidoCrvStaker;
  let stagerStaker: StaderStaker;
  let impersonatedSigner: Signer;
  let curve: any;
  beforeEach(async () => {
    await impersonateAccount(IMPERSONATE_ADDRESS);

    impersonatedSigner = await ethers.getSigner(IMPERSONATE_ADDRESS);

    lidoCrvStaker = await new LidoCrvStaker__factory(
      impersonatedSigner,
    ).deploy();
    curve = new ethers.Contract(
      CURVE_CONTRACT_ADDRESS,
      ICurve__factory.abi,
      impersonatedSigner,
    );
    stagerStaker = await new StaderStaker__factory(impersonatedSigner).deploy();

    await lidoCrvStaker.initialize();
    await stagerStaker.initialize();
  });

  it('Allows to stake at lido and crv', async function () {
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

  it('Checks received lp tokens', async function () {
    const amountsToDeposit = [10, 21, 5, 1, 0.5, 0.2, 0.1, 0.01];

    for (let i = 0; i < amountsToDeposit.length; i++) {
      const depositEthAmount = amountsToDeposit[i] / 2;
      const depositStEthAmount = amountsToDeposit[i] / 2;
      const balanceBefore = await (
        await getErc20(impersonatedSigner, ETH_STETH_CONTRACT_ADDRESS)
      ).balanceOf(await impersonatedSigner.getAddress());

      const receiveLpAmount = await curve.calc_token_amount(
        [
          ethers.utils.parseEther(depositEthAmount.toString()),
          ethers.utils.parseEther(depositStEthAmount.toString()),
        ],
        true,
      );

      const tx = await impersonatedSigner.sendTransaction({
        to: lidoCrvStaker.address,
        value: ethers.utils.parseEther(amountsToDeposit[i].toString()),
      });
      await tx.wait();

      const balanceAfter = await (
        await getErc20(impersonatedSigner, ETH_STETH_CONTRACT_ADDRESS)
      ).balanceOf(await impersonatedSigner.getAddress());

      expect(
        receiveLpAmount,
      ).closeTo(balanceAfter.sub(balanceBefore),10**14);
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
