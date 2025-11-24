import { expect } from "chai";
import { ethers } from "hardhat";
import { TorReputationStore } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("TorReputationStore", function () {
  let contract: TorReputationStore;
  let owner: SignerWithAddress;
  let updater1: SignerWithAddress;
  let updater2: SignerWithAddress;
  let unauthorized: SignerWithAddress;

  // Sample relay data
  const sampleRelay = {
    fingerprint: "A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4E5F6A1B2",
    nickname: "TorRelayTest",
    flags: ["Guard", "Fast", "Stable"],
    uptime: 950,
    bandwidth: 1000000,
    consensusWeight: 500,
    country: "US",
    asNumber: "AS1234",
    lastSeen: Math.floor(Date.now() / 1000),
    running: true,
  };

  beforeEach(async function () {
    [owner, updater1, updater2, unauthorized] = await ethers.getSigners();

    const TorReputationStore = await ethers.getContractFactory("TorReputationStore");
    contract = await TorReputationStore.deploy();
    await contract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await contract.owner()).to.equal(owner.address);
    });

    it("Should start with zero relays", async function () {
      expect(await contract.getRelayCount()).to.equal(0);
    });
  });

  describe("Ownership Management", function () {
    it("Should transfer ownership", async function () {
      await expect(contract.transferOwnership(updater1.address))
        .to.emit(contract, "OwnershipTransferred")
        .withArgs(owner.address, updater1.address);

      expect(await contract.owner()).to.equal(updater1.address);
    });

    it("Should reject ownership transfer to zero address", async function () {
      await expect(
        contract.transferOwnership(ethers.ZeroAddress)
      ).to.be.revertedWith("New owner cannot be zero address");
    });

    it("Should reject ownership transfer from non-owner", async function () {
      await expect(
        contract.connect(unauthorized).transferOwnership(updater1.address)
      ).to.be.revertedWith("Only owner can call this function");
    });
  });

  describe("Authorized Updater Management", function () {
    it("Should add authorized updater", async function () {
      await expect(contract.addAuthorizedUpdater(updater1.address))
        .to.emit(contract, "AuthorizedUpdaterAdded")
        .withArgs(updater1.address);

      expect(await contract.authorizedUpdaters(updater1.address)).to.be.true;
    });

    it("Should remove authorized updater", async function () {
      await contract.addAuthorizedUpdater(updater1.address);

      await expect(contract.removeAuthorizedUpdater(updater1.address))
        .to.emit(contract, "AuthorizedUpdaterRemoved")
        .withArgs(updater1.address);

      expect(await contract.authorizedUpdaters(updater1.address)).to.be.false;
    });

    it("Should reject adding zero address as updater", async function () {
      await expect(
        contract.addAuthorizedUpdater(ethers.ZeroAddress)
      ).to.be.revertedWith("Updater cannot be zero address");
    });

    it("Should reject adding already authorized updater", async function () {
      await contract.addAuthorizedUpdater(updater1.address);
      await expect(
        contract.addAuthorizedUpdater(updater1.address)
      ).to.be.revertedWith("Address already authorized");
    });

    it("Should reject removing non-authorized updater", async function () {
      await expect(
        contract.removeAuthorizedUpdater(updater1.address)
      ).to.be.revertedWith("Address not authorized");
    });

    it("Should reject updater management from non-owner", async function () {
      await expect(
        contract.connect(unauthorized).addAuthorizedUpdater(updater1.address)
      ).to.be.revertedWith("Only owner can call this function");
    });
  });

  describe("Relay Updates", function () {
    it("Should allow owner to update relay", async function () {
      await expect(
        contract.updateRelay(
          sampleRelay.fingerprint,
          sampleRelay.nickname,
          sampleRelay.flags,
          sampleRelay.uptime,
          sampleRelay.bandwidth,
          sampleRelay.consensusWeight,
          sampleRelay.country,
          sampleRelay.asNumber,
          sampleRelay.lastSeen,
          sampleRelay.running
        )
      )
        .to.emit(contract, "RelayUpdated")
        .withArgs(sampleRelay.fingerprint, sampleRelay.nickname);

      expect(await contract.getRelayCount()).to.equal(1);
    });

    it("Should allow authorized updater to update relay", async function () {
      await contract.addAuthorizedUpdater(updater1.address);

      await expect(
        contract.connect(updater1).updateRelay(
          sampleRelay.fingerprint,
          sampleRelay.nickname,
          sampleRelay.flags,
          sampleRelay.uptime,
          sampleRelay.bandwidth,
          sampleRelay.consensusWeight,
          sampleRelay.country,
          sampleRelay.asNumber,
          sampleRelay.lastSeen,
          sampleRelay.running
        )
      )
        .to.emit(contract, "RelayUpdated")
        .withArgs(sampleRelay.fingerprint, sampleRelay.nickname);
    });

    it("Should reject update from unauthorized address", async function () {
      await expect(
        contract.connect(unauthorized).updateRelay(
          sampleRelay.fingerprint,
          sampleRelay.nickname,
          sampleRelay.flags,
          sampleRelay.uptime,
          sampleRelay.bandwidth,
          sampleRelay.consensusWeight,
          sampleRelay.country,
          sampleRelay.asNumber,
          sampleRelay.lastSeen,
          sampleRelay.running
        )
      ).to.be.revertedWith("Only owner or authorized updaters can call this function");
    });

    it("Should reject invalid fingerprint length", async function () {
      await expect(
        contract.updateRelay(
          "SHORT",
          sampleRelay.nickname,
          sampleRelay.flags,
          sampleRelay.uptime,
          sampleRelay.bandwidth,
          sampleRelay.consensusWeight,
          sampleRelay.country,
          sampleRelay.asNumber,
          sampleRelay.lastSeen,
          sampleRelay.running
        )
      ).to.be.revertedWith("Invalid fingerprint length");
    });

    it("Should reject uptime > 1000", async function () {
      await expect(
        contract.updateRelay(
          sampleRelay.fingerprint,
          sampleRelay.nickname,
          sampleRelay.flags,
          1001,
          sampleRelay.bandwidth,
          sampleRelay.consensusWeight,
          sampleRelay.country,
          sampleRelay.asNumber,
          sampleRelay.lastSeen,
          sampleRelay.running
        )
      ).to.be.revertedWith("Uptime exceeds maximum");
    });

    it("Should update existing relay", async function () {
      await contract.updateRelay(
        sampleRelay.fingerprint,
        sampleRelay.nickname,
        sampleRelay.flags,
        sampleRelay.uptime,
        sampleRelay.bandwidth,
        sampleRelay.consensusWeight,
        sampleRelay.country,
        sampleRelay.asNumber,
        sampleRelay.lastSeen,
        sampleRelay.running
      );

      const updatedNickname = "UpdatedRelay";
      await contract.updateRelay(
        sampleRelay.fingerprint,
        updatedNickname,
        sampleRelay.flags,
        sampleRelay.uptime,
        sampleRelay.bandwidth,
        sampleRelay.consensusWeight,
        sampleRelay.country,
        sampleRelay.asNumber,
        sampleRelay.lastSeen,
        sampleRelay.running
      );

      expect(await contract.getRelayCount()).to.equal(1);
      const relay = await contract.getRelay(sampleRelay.fingerprint);
      expect(relay.nickname).to.equal(updatedNickname);
    });
  });

  describe("Batch Updates", function () {
    it("Should batch update multiple relays", async function () {
      const relays = [
        { ...sampleRelay, fingerprint: "A".repeat(40), nickname: "Relay1" },
        { ...sampleRelay, fingerprint: "B".repeat(40), nickname: "Relay2" },
        { ...sampleRelay, fingerprint: "C".repeat(40), nickname: "Relay3" },
      ];

      await expect(contract.batchUpdateRelays(relays))
        .to.emit(contract, "RelayBatchUpdated")
        .withArgs(3);

      expect(await contract.getRelayCount()).to.equal(3);
    });

    it("Should allow authorized updater to batch update", async function () {
      await contract.addAuthorizedUpdater(updater1.address);

      const relays = [
        { ...sampleRelay, fingerprint: "A".repeat(40), nickname: "Relay1" },
        { ...sampleRelay, fingerprint: "B".repeat(40), nickname: "Relay2" },
      ];

      await expect(contract.connect(updater1).batchUpdateRelays(relays))
        .to.emit(contract, "RelayBatchUpdated")
        .withArgs(2);
    });

    it("Should reject batch update from unauthorized", async function () {
      const relays = [{ ...sampleRelay }];

      await expect(
        contract.connect(unauthorized).batchUpdateRelays(relays)
      ).to.be.revertedWith("Only owner or authorized updaters can call this function");
    });

    it("Should reject batch with invalid fingerprint", async function () {
      const relays = [{ ...sampleRelay, fingerprint: "SHORT" }];

      await expect(contract.batchUpdateRelays(relays)).to.be.revertedWith(
        "Invalid fingerprint length"
      );
    });
  });

  describe("Relay Queries", function () {
    beforeEach(async function () {
      await contract.updateRelay(
        sampleRelay.fingerprint,
        sampleRelay.nickname,
        sampleRelay.flags,
        sampleRelay.uptime,
        sampleRelay.bandwidth,
        sampleRelay.consensusWeight,
        sampleRelay.country,
        sampleRelay.asNumber,
        sampleRelay.lastSeen,
        sampleRelay.running
      );
    });

    it("Should get relay by fingerprint", async function () {
      const relay = await contract.getRelay(sampleRelay.fingerprint);

      expect(relay.fingerprint).to.equal(sampleRelay.fingerprint);
      expect(relay.nickname).to.equal(sampleRelay.nickname);
      expect(relay.uptime).to.equal(sampleRelay.uptime);
      expect(relay.bandwidth).to.equal(sampleRelay.bandwidth);
      expect(relay.running).to.equal(sampleRelay.running);
    });

    it("Should return correct relay count", async function () {
      expect(await contract.getRelayCount()).to.equal(1);
    });

    it("Should check if relay exists", async function () {
      expect(await contract.relayExists(sampleRelay.fingerprint)).to.be.true;
      expect(await contract.relayExists("X".repeat(40))).to.be.false;
    });

    it("Should get fingerprint by index", async function () {
      const fingerprint = await contract.getFingerprintByIndex(0);
      expect(fingerprint).to.equal(sampleRelay.fingerprint);
    });

    it("Should reject invalid index", async function () {
      await expect(contract.getFingerprintByIndex(999)).to.be.revertedWith(
        "Index out of bounds"
      );
    });

    it("Should reject getting non-existent relay", async function () {
      await expect(contract.getRelay("X".repeat(40))).to.be.revertedWith(
        "Relay not found"
      );
    });
  });

  describe("Pagination", function () {
    beforeEach(async function () {
      const relays = [];
      for (let i = 0; i < 10; i++) {
        relays.push({
          ...sampleRelay,
          fingerprint: i.toString().repeat(40),
          nickname: `Relay${i}`,
        });
      }
      await contract.batchUpdateRelays(relays);
    });

    it("Should get paginated relays", async function () {
      const relays = await contract.getRelaysPaginated(0, 5);
      expect(relays.length).to.equal(5);
      expect(relays[0].nickname).to.equal("Relay0");
      expect(relays[4].nickname).to.equal("Relay4");
    });

    it("Should handle pagination beyond bounds", async function () {
      const relays = await contract.getRelaysPaginated(8, 5);
      expect(relays.length).to.equal(2);
    });

    it("Should reject offset out of bounds", async function () {
      await expect(contract.getRelaysPaginated(999, 5)).to.be.revertedWith(
        "Offset out of bounds"
      );
    });
  });
});
