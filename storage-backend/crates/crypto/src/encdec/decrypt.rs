

#[cfg(any(test, feature = "crypto"))]
pub fn decrypt_data(password: &[u8], data: &[u8]) -> Result<Vec<u8>, crate::Error> {
    use crate::encdec::id::ID;
    use crate::error::Error;
    use aes_gcm::{Aes256Gcm, KeyInit as _};
    use chacha20poly1305::ChaCha20Poly1305;

    const HEADER_LENGTH: usize = 45;
    if data.len() < HEADER_LENGTH {
        return Err(Error::ErrUnexpectedHeader);
    }

    let (salt, id, nonce_slice) = (&data[..32], ID::try_from(data[32])?, &data[33..45]);
    let body = &data[HEADER_LENGTH..];

    match id {
        ID::Argon2idChaCHa20Poly1305 => {
            let key = id.get_key(password, salt)?;
            decrypt(ChaCha20Poly1305::new_from_slice(&key)?, nonce_slice, body)
        }
        _ => {
            let key = id.get_key(password, salt)?;
            decrypt(Aes256Gcm::new_from_slice(&key)?, nonce_slice, body)
        }
    }
}

#[cfg(any(test, feature = "crypto"))]
#[inline]
fn decrypt<T: aes_gcm::aead::Aead>(stream: T, nonce: &[u8], data: &[u8]) -> Result<Vec<u8>, crate::Error> {
    use crate::error::Error;
    use aes_gcm::AeadCore;
    use aes_gcm::aead::array::Array;
    use core::convert::TryFrom;

    let nonce_arr: Array<u8, <T as AeadCore>::NonceSize> =
        Array::try_from(nonce).map_err(|_| Error::ErrDecryptFailed(aes_gcm::aead::Error))?;
    stream.decrypt(&nonce_arr, data).map_err(Error::ErrDecryptFailed)
}

#[cfg(not(any(test, feature = "crypto")))]
pub fn decrypt_data(_password: &[u8], data: &[u8]) -> Result<Vec<u8>, crate::Error> {
    Ok(data.to_vec())
}
