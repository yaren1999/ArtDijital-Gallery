const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ArtToken", function () {
    let artToken,Token, owner, addr1, addr2;
    const INITIAL_SUPPLY = ethers.parseEther("1000000");

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        const Token = await ethers.getContractFactory("ArtToken");
        token = await Token.deploy(INITIAL_SUPPLY);
    });

    describe("1. Deploy Doğru çalışıyor mu", function () {
        it("Toplam arz doğru olmalı", async function () {
            expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY);
        });

        it("Owner (sahip) tüm arza sahip olmalı", async function () {
            expect(await token.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY);
        });

        it("İsim ve sembol doğru olmalı", async function () {
            expect(await token.name()).to.equal("Art Token");
            expect(await token.symbol()).to.equal("ART");
        });
    });

    describe("2. Transfer ve onay işlemleri", function () {
        it("Direkt Transfer çalışmalı", async function () {
            const amount = ethers.parseEther("100");
            await token.transfer(addr1.address, amount);
            expect(await token.balanceOf(addr1.address)).to.equal(amount);
        });

        it("Sıfır (0x0) adresine transfer yapamamalı", async function () {
            await expect(
                token.transfer(ethers.ZeroAddress, 100)
            ).to.be.revertedWithCustomError(token, "ERC20InvalidReceiver");
        });

        it("Yetersiz bakiyede transfer başarısız olmalı", async function () {
            const miktar = ethers.parseEther("10");
            await expect(
                token.connect(addr1).transfer(owner.address, miktar)
            ).to.be.revertedWithCustomError(token, "ERC20InsufficientBalance");
        });
    });

    describe("3. Approve ve TransferFrom işlemleri", function () {
        it("Approve ve TransferFrom doğru çalışmalı", async function () {
            const amount = ethers.parseEther("100");
            await token.approve(addr1.address, amount);
            await token.connect(addr1).transferFrom(owner.address, addr2.address, amount);
            expect(await token.balanceOf(addr2.address)).to.equal(amount);
        });

        it("Allowance (izin) harcandıkça azalmalı", async function () {
            const totalAllowance = ethers.parseEther("100");
            const spendAmount = ethers.parseEther("50");
            await token.approve(addr1.address, totalAllowance);
            await token.connect(addr1).transferFrom(owner.address, addr2.address, spendAmount);
            expect(await token.allowance(owner.address, addr1.address))
                .to.equal(totalAllowance - spendAmount);
        });

        it("Allowance yetersizse transferFrom reddedilmeli", async function () {
            const limit = ethers.parseEther("50");
            const tryingToSpend = ethers.parseEther("100");
            await token.approve(addr1.address, limit);
            await expect(
                token.connect(addr1).transferFrom(owner.address, addr2.address, tryingToSpend)
            ).to.be.revertedWithCustomError(token, "ERC20InsufficientAllowance");
        });

        it("Onay miktarı güncellendiğinde allowance değişmeli", async function () {
            await token.approve(addr1.address, ethers.parseEther("100"));
            await token.approve(addr1.address, ethers.parseEther("50"));
            expect(await token.allowance(owner.address, addr1.address))
                .to.equal(ethers.parseEther("50"));
        });

        it("Sıfır adresine approve (onay) verilememeli", async function () {
            await expect(
                token.approve(ethers.ZeroAddress, ethers.parseEther("100"))
            ).to.be.revertedWithCustomError(token, "ERC20InvalidSpender");
        });
    });

    describe("4. Güvenlik ve Pausable", function () {
        it("Sistem durdurulduğunda direk transfer yapılamamalı", async function () {
            await token.pause();
            await expect(
                token.transfer(addr1.address, 100)
            ).to.be.revertedWithCustomError(token, "EnforcedPause");
        });

        it("Pause edildikten sonra Unpause ile tekrar transfer yapılabilmeli", async function () {
           const amount = ethers.parseEther("50");
          await token.pause();
          await expect(
             token.transfer(addr1.address, amount)
           ).to.be.revertedWithCustomError(token, "EnforcedPause");

           await token.unpause();
           await token.transfer(addr1.address, amount);
           expect(await token.balanceOf(addr1.address)).to.equal(amount);
        });

        it("Sadece owner (sahip) pause yapabilmeli", async function () {
            await expect(
                token.connect(addr1).pause()
            ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
        });
    });

    describe("5. Mint & Burn", function () {
        it("Owner (Sahip) kendi kendine de para basabilmeli", async function () {
           const miktar = ethers.parseEther("100"); 
           await token.mint(owner.address, miktar); 
           expect(await token.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY + miktar);
        });

        it("Sahip (Owner) yeni token üretebilmeli", async function () {
            const mintAmount = ethers.parseEther("500");
            await token.mint(addr1.address, mintAmount);
            expect(await token.balanceOf(addr1.address)).to.equal(mintAmount);
        });

        it("Owner olmayan mint yapamamalı", async function () {
            await expect(
                token.connect(addr1).mint(addr1.address, 100)
            ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
        });

        it("Kullanıcılar kendi tokenlarını yakabilmeli", async function () {
            const burnAmount = ethers.parseEther("100");
            await token.transfer(addr1.address, burnAmount);
            await token.connect(addr1).burn(burnAmount);
            expect(await token.balanceOf(addr1.address)).to.equal(0);
        });
    });
});