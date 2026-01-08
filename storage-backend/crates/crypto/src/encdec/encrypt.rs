

#[cfg(any(test, feature = "crypto"))]
pub fn encrypt_data(password: &[u8], data: &[u8]) -> Result<Vec<u8>, crate::Error> {
    use crate::encdec::id::ID;
    use aes_gcm::Aes256Gcm;
    use aes_gcm::KeyInit as _;
    use rand::random;

    let salt: [u8; 32] = random();

    #[cfg(feature = "fips")]
    let id = ID::Pbkdf2AESGCM;

    #[cfg(not(feature = "fips"))]
    let id = if native_aes() {
        ID::Argon2idAESGCM
    } else {
        ID::Argon2idChaCHa20Poly1305
    };

    let key = id.get_key(password, &salt)?;

    #[cfg(feature = "fips")]
    {
        encrypt(Aes256Gcm::new_from_slice(&key)?, &salt, id, data)
    }

    #[cfg(not(feature = "fips"))]
    {
        if native_aes() {
            encrypt(Aes256Gcm::new_from_slice(&key)?, &salt, id, data)
        } else {
            encrypt(chacha20poly1305::ChaCha20Poly1305::new_from_slice(&key)?, &salt, id, data)
        }
    }
}

#[cfg(any(test, feature = "crypto"))]
fn encrypt<T: aes_gcm::aead::Aead>(
    stream: T,
    salt: &[u8],
    id: crate::encdec::id::ID,
    data: &[u8],
) -> Result<Vec<u8>, crate::Error> {
    use crate::error::Error;
    use aes_gcm::AeadCore;
    use aes_gcm::aead::array::Array;
    use rand::RngCore;

    let mut nonce: Array<u8, <T as AeadCore>::NonceSize> = Array::default();
    rand::rng().fill_bytes(&mut nonce);

    let encryptor = stream.encrypt(&nonce, data).map_err(Error::ErrEncryptFailed)?;

    let mut ciphertext = Vec::with_capacity(salt.len() + 1 + nonce.len() + encryptor.len());
    ciphertext.extend_from_slice(salt);
    ciphertext.push(id as u8);
    ciphertext.extend_from_slice(&nonce);
    ciphertext.extend_from_slice(&encryptor);

    Ok(ciphertext)
}

#[cfg(not(any(test, feature = "crypto")))]
pub fn encrypt_data(_password: &[u8], data: &[u8]) -> Result<Vec<u8>, crate::Error> {
    Ok(data.to_vec())
}
