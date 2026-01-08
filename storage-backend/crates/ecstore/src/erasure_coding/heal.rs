

use super::BitrotReader;
use super::BitrotWriterWrapper;
use super::decode::ParallelReader;
use crate::disk::error::{Error, Result};
use crate::erasure_coding::encode::MultiWriter;
use bytes::Bytes;
use tokio::io::AsyncRead;
use tracing::info;

impl super::Erasure {
    pub async fn heal<R>(
        &self,
        writers: &mut [Option<BitrotWriterWrapper>],
        readers: Vec<Option<BitrotReader<R>>>,
        total_length: usize,
        _prefer: &[bool],
    ) -> Result<()>
    where
        R: AsyncRead + Unpin + Send + Sync,
    {
        info!(
            "Erasure heal, writers len: {}, readers len: {}, total_length: {}",
            writers.len(),
            readers.len(),
            total_length
        );
        if writers.len() != self.parity_shards + self.data_shards {
            return Err(Error::other("invalid argument"));
        }
        let mut reader = ParallelReader::new(readers, self.clone(), 0, total_length);

        let start_block = 0;
        let mut end_block = total_length / self.block_size;
        if total_length % self.block_size != 0 {
            end_block += 1;
        }

        for _ in start_block..end_block {
            let (mut shards, errs) = reader.read().await;

            // Check if we have enough shards to reconstruct data
            // We need at least data_shards available shards (data + parity combined)
            let available_shards = errs.iter().filter(|e| e.is_none()).count();
            if available_shards < self.data_shards {
                return Err(Error::other(format!(
                    "can not reconstruct data: not enough available shards (need {}, have {}) {errs:?}",
                    self.data_shards, available_shards
                )));
            }

            if self.parity_shards > 0 {
                self.decode_data(&mut shards)?;
            }

            let shards = shards
                .into_iter()
                .map(|s| Bytes::from(s.unwrap_or_default()))
                .collect::<Vec<_>>();

            // Calculate proper write quorum for heal operation
            // For heal, we only write to disks that need healing, so write quorum should be
            // the number of available writers (disks that need healing)
            let available_writers = writers.iter().filter(|w| w.is_some()).count();
            let write_quorum = available_writers.max(1); // At least 1 writer must succeed
            let mut writers = MultiWriter::new(writers, write_quorum);
            writers.write(shards).await?;
        }

        Ok(())
    }
}
