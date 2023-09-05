/* eslint-disable */

import {
  time,
  loadFixture,
  impersonateAccount,
  setNextBlockBaseFeePerGas,
  mine
} from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

import {
  LidoCrvStaker__factory,
  StaderStaker__factory,
  LidoCrvStaker,
  StaderStaker,
  TestERC20__factory,
} from '../typechain-types';

import { Signer } from 'ethers';
import { Address } from 'hardhat-deploy/types';

const ETHX_CONTRACT_ADDRESS = '0xA35b1B31Ce002FBF2058D22F30f95D405200A15b';
const STE_CRV_CONTRACT_ADDRESS = '0x06325440D014e39736583c165C2963BA99fAf14E';
const STETH_CONTRACT_ADDRESS = '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84';

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

  beforeEach(async () => {
    await impersonateAccount(IMPERSONATE_ADDRESS);

    impersonatedSigner = await ethers.getSigner(IMPERSONATE_ADDRESS);

    lidoCrvStaker = await new LidoCrvStaker__factory(
      impersonatedSigner,
    ).deploy();

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
                await getErc20(impersonatedSigner, STE_CRV_CONTRACT_ADDRESS)
              ).balanceOf(lidoCrvStaker.address),
            ),
          ),
        ).to.be.eq(0);
      }),
    );

    const tx = await impersonatedSigner.sendTransaction({
      to: lidoCrvStaker.address,
      value: 0,
      gasLimit: 300000000,
    });
  });

  it('Checks received lp tokens', async function () {
    const gasPrice = await impersonatedSigner.getGasPrice();
    console.log('gasPrice', +gasPrice);
    const tx = await impersonatedSigner.sendTransaction({
      to: lidoCrvStaker.address,
      value: ethers.utils.parseEther('20'),
    });
    await tx.wait();
    const provider = ethers.providers.getDefaultProvider();

    // console.log(
    //   'ETH CONTACT BAL',
    //   await provider.getBalance(lidoCrvStaker.address),
    // );
    // console.log(
    //   'LP TOKENS CONTRACT BALANCE',
    //   ethers.utils.formatEther(
    //     await (
    //       await getErc20(impersonatedSigner, STE_CRV_CONTRACT_ADDRESS)
    //     ).balanceOf(lidoCrvStaker.address),
    //   ),
    // );
    // console.log(
    //   'ST ETH CONTRACT BALANCE',
    //   ethers.utils.formatEther(
    //     await (
    //       await getErc20(impersonatedSigner, STETH_CONTRACT_ADDRESS)
    //     ).balanceOf(lidoCrvStaker.address),
    //   ),
    // );
    // console.log(
    //   'LP TOKENS USER BALANCE:',
    //   ethers.utils.formatEther(
    //     await (
    //       await getErc20(impersonatedSigner, STE_CRV_CONTRACT_ADDRESS)
    //     ).balanceOf(await impersonatedSigner.getAddress()),
    //   ),
    // );
    // console.log(
    //   'ST ETH USER BALANCE ',
    //   ethers.utils.formatEther(
    //     await (
    //       await getErc20(impersonatedSigner, STETH_CONTRACT_ADDRESS)
    //     ).balanceOf(await impersonatedSigner.getAddress()),
    //   ),
    // );
    // await expect(
    //   parseFloat(
    //     ethers.utils.formatEther(
    //       await (
    //         await getErc20(impersonatedSigner, STE_CRV_CONTRACT_ADDRESS)
    //       ).balanceOf(await impersonatedSigner.getAddress()),
    //     ),
    //   ),
    // ).to.be.greaterThan(n - 1);

    // expect(
    //   parseFloat(
    //     ethers.utils.formatEther(
    //       await (
    //         await getErc20(impersonatedSigner, STE_CRV_CONTRACT_ADDRESS)
    //       ).balanceOf(await impersonatedSigner.getAddress()),
    //     ),
    //   ),
    // ).to.be.greaterThan(19);
  });

  it.only('Allows to stake at stager', async function () {
    const amountToSend = ethers.utils.parseEther('1.0'); // 1 ETH

    
    await setNextBlockBaseFeePerGas(0)
    await mine()
    const tx = await impersonatedSigner.sendTransaction({
      to: stagerStaker.address,
      value: amountToSend,
      maxPriorityFeePerGas:0,
      maxFeePerGas:0
    });
   
    await tx.wait();

    const contract = new ethers.Contract(
      ETHX_CONTRACT_ADDRESS,
      TestERC20__factory.abi,
      impersonatedSigner,
    );
      console.log(parseFloat(
        ethers.utils.formatEther(
          await contract.balanceOf(await impersonatedSigner.getAddress()),
        ),
      ),)
    expect(
      parseFloat(
        ethers.utils.formatEther(
          await contract.balanceOf(await impersonatedSigner.getAddress()),
        ),
      ),
    ).to.be.greaterThan(0);
  });
});
