

/// Check if MQTT Broker is available
/// # Arguments
/// * `broker_url` - URL of MQTT Broker, for example `mqtt://localhost:1883`
/// * `topic` - Topic for testing connections
/// # Returns
/// * `Ok(())` - If the connection is successful
/// * `Err(String)` - If the connection fails, contains an error message
///
/// # Example
/// ```rust,no_run
///  #[tokio::main]
///  async fn main() {
///     let result = nebulafx_targets::check_mqtt_broker_available("mqtt://localhost:1883", "test/topic").await;
///     if result.is_ok() {
///         println!("MQTT Broker is available");
///     } else {
///         println!("MQTT Broker is not available: {}", result.err().unwrap());
///     }
///  }
/// ```
/// # Note
/// Need to add `rumqttc` and `url` dependencies in `Cargo.toml`
/// ```toml
/// [dependencies]
/// rumqttc = "0.25.0"
/// url = "2.5.7"
/// tokio = { version = "1", features = ["full"] }
/// ```
pub async fn check_mqtt_broker_available(broker_url: &str, topic: &str) -> Result<(), String> {
    use rumqttc::{AsyncClient, MqttOptions, QoS};
    let url = nebulafx_utils::parse_url(broker_url).map_err(|e| format!("Broker URL parsing failed:{e}"))?;
    let url = url.url();

    match url.scheme() {
        "tcp" | "ssl" | "ws" | "wss" | "mqtt" | "mqtts" | "tls" | "tcps" => {}
        _ => return Err("unsupported broker url scheme".to_string()),
    }

    let host = url.host_str().ok_or("Broker is missing host")?;
    let port = url.port().unwrap_or(1883);
    let mut mqtt_options = MqttOptions::new("nebulafx_check", host, port);
    mqtt_options.set_keep_alive(std::time::Duration::from_secs(5));
    let (client, mut eventloop) = AsyncClient::new(mqtt_options, 1);

    // Try to connect and subscribe
    client
        .subscribe(topic, QoS::AtLeastOnce)
        .await
        .map_err(|e| format!("MQTT subscription failed:{e}"))?;
    // Wait for eventloop to receive at least one event
    match tokio::time::timeout(std::time::Duration::from_secs(3), eventloop.poll()).await {
        Ok(Ok(_)) => Ok(()),
        Ok(Err(e)) => Err(format!("MQTT connection failed:{e}")),
        Err(_) => Err("MQTT connection timeout".to_string()),
    }
}
