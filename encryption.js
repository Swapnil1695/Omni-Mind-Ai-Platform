const crypto = require('crypto');
const logger = require('./logger');

class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
    
    if (!this.key || this.key.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be 32 bytes hex string');
    }
  }

  encrypt(text) {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      return {
        iv: iv.toString('hex'),
        content: encrypted,
        tag: tag.toString('hex'),
      };
    } catch (error) {
      logger.error('Encryption error:', error);
      throw new Error('Encryption failed');
    }
  }

  decrypt(encryptedData) {
    try {
      const { iv, content, tag } = encryptedData;
      
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.key,
        Buffer.from(iv, 'hex')
      );
      
      decipher.setAuthTag(Buffer.from(tag, 'hex'));
      
      let decrypted = decipher.update(content, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      logger.error('Decryption error:', error);
      throw new Error('Decryption failed');
    }
  }

  hash(text, salt = null) {
    const hash = crypto.createHash('sha256');
    
    if (salt) {
      hash.update(text + salt);
    } else {
      hash.update(text);
    }
    
    return hash.digest('hex');
  }

  generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  verifyHash(text, hash, salt = null) {
    return this.hash(text, salt) === hash;
  }
}

module.exports = new EncryptionService();