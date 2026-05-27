import database from "../config/database.js";

class TrustedChannelModel {

  async getAllTrustedChannels() {

    const query = `
      SELECT
        channel_name,
        trust_score
      FROM trusted_channels
    `;

    const result =
      await database.query(query);

    return result.rows;
  }
}

export default new TrustedChannelModel();