/* eslint-disable */

import {
  time,
  loadFixture,
  impersonateAccount,
} from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

import {
  LidoCrvStaker__factory,
  StagerStaker__factory,
  LidoCrvStaker,
  StagerStaker,
  TestERC20__factory,
} from '../typechain-types';

import { Signer } from 'ethers';

const ETHX_CONTRACT_ADDRESS = '0xA35b1B31Ce002FBF2058D22F30f95D405200A15b';
const STE_CRV_CONTRACT_ADDRESS = '0x06325440D014e39736583c165C2963BA99fAf14E';
const IMPERSONATE_ADDRESS = '0x73AF3bcf944a6559933396c1577B257e2054D935';
describe('Staking flow test', function () {
  let lidoCrvStaker: LidoCrvStaker;
  let stagerStaker: StagerStaker;
  let impersonatedSigner: Signer;

  beforeEach(async () => {
    await impersonateAccount(IMPERSONATE_ADDRESS);
    impersonatedSigner = await ethers.getSigner(IMPERSONATE_ADDRESS);

    lidoCrvStaker = await new LidoCrvStaker__factory(
      impersonatedSigner,
    ).deploy();

    stagerStaker = await new StagerStaker__factory(impersonatedSigner).deploy();
  });

  it('Allows to stake at lido and crv', async function () {
    const amountToSend = ethers.utils.parseEther('1.0');

    const tx = await impersonatedSigner.sendTransaction({
      to: lidoCrvStaker.address,
      value: amountToSend,
      gasLimit: 300000000,
    });

    await tx.wait();

    const contract = new ethers.Contract(
      STE_CRV_CONTRACT_ADDRESS,
      TestERC20__factory.abi,
      impersonatedSigner,
    );

    expect(
      parseFloat(
        await ethers.utils.formatEther(
          await contract.balanceOf(await impersonatedSigner.getAddress()),
        ),
      ),
    ).to.be.greaterThan(0);
    console.log(
      'Received steCRV after staking 1ETH:',
      parseFloat(
        ethers.utils.formatEther(
          await contract.balanceOf(await impersonatedSigner.getAddress()),
        ),
      ),
    );
  });

  it('Allows to stake at stager', async function () {
    const amountToSend = ethers.utils.parseEther('1.0'); // 1 ETH

    const tx = await impersonatedSigner.sendTransaction({
      to: stagerStaker.address,
      value: amountToSend,
    });

    await tx.wait();

    const contract = new ethers.Contract(
      ETHX_CONTRACT_ADDRESS,
      TestERC20__factory.abi,
      impersonatedSigner,
    );

    console.log(
      'Received ETHX after staking 1ETH:',
      parseFloat(ethers.utils.formatEther(
        await contract.balanceOf(await impersonatedSigner.getAddress()),
      )),
    );
  });
});
