# Linux Server Notification Script Generator

This repository contains a simple web-based tool to generate a Bash script for monitoring various Linux server resources and sending email notifications when thresholds are exceeded or services are down. The generated script is designed to be run as a cron job on your Linux VPS or server.

## Features

* **Customizable Email Notifications**: Set recipient and sender email addresses.
* **Resource Monitoring**:
    * Disk Usage (with configurable threshold)
    * CPU Usage (with configurable threshold)
    * Memory Usage (with configurable threshold)
    * Specific Service Status (e.g., Apache2, Nginx, MySQL)
    * Failed SSH Login Attempts (with configurable threshold)
* **Generated Bash Script**: Outputs a ready-to-use `.sh` script.
* **Copy to Clipboard**: Easily copy the generated script.

## How it Works

The web application (HTML, CSS, JavaScript) provides a user-friendly interface to select monitoring options and set thresholds. Based on your inputs, it dynamically generates a Bash script. This Bash script, when executed on your Linux server, performs the checks and sends email alerts using the `mail` command.

**Important Note on Email Sending:**
The generated script leverages your server's configured Mail Transfer Agent (MTA) like Exim4 or Postfix. It's crucial that your MTA is correctly set up to send emails externally, including proper SPF, DKIM, and PTR records for the sender domain. This generator provides the script logic; the underlying email infrastructure on your server must be functional.

## Getting Started

### 1. Download the Files

Clone this repository or download the following files into a directory on your local machine:

* `index.html`
* `style.css`
* `script.js`

### 2. Open the Web Tool

Open `index.html` in your preferred web browser.

### 3. Configure Notification Settings

On the web page, you will see sections to configure:

* **Recipient Email**: The email address where you want to receive alerts.
* **Sender Email**: The email address that the alerts will appear to come from. **It is highly recommended to use an email address from a domain that is properly configured with SPF and DKIM records on your server's MTA (e.g., `notifier@your-working-domain.com`).** If your server uses a control panel like HestiaCP that rewrites sender addresses for system users, you can use an address like `root@your-server-hostname.com` and rely on the MTA's rewriting rules, but explicitly setting an authenticated sender is generally more reliable.
* **Resource Checkboxes**: Select which resources you want to monitor (Disk, CPU, Memory, Service, SSH Failed Logins).
* **Thresholds**: Adjust the percentage thresholds for disk, CPU, and memory, and the attempts threshold for SSH logins.
* **Service Name**: If monitoring a service, provide its exact Systemd service name (e.g., `apache2`, `nginx`, `mysql`).

### 4. Generate the Script

Click the "Generate Script" button. The Bash script will appear in the "Generated Linux Script" box.

### 5. Deploy and Execute the Script on Your Linux Server

1.  **Copy the Script**: Click "Copy Script to Clipboard" or manually copy the entire content from the `Generated Linux Script` box.
2.  **Save on Server**: Log in to your Linux VPS/server via SSH and create a new file (e.g., `notifier.sh`) in a suitable directory (e.g., `/opt/scripts/` or `~/` for testing):
    ```bash
    nano /opt/scripts/notifier.sh
    # Paste the copied script content into this file.
    # Save and exit (Ctrl+X, Y, Enter for nano).
    ```
3.  **Make Executable**: Grant execute permissions to the script:
    ```bash
    chmod +x /opt/scripts/notifier.sh
    ```
4.  **Test (Optional but Recommended)**: Run the script manually to ensure it executes without errors and you receive test emails:
    ```bash
    /opt/scripts/notifier.sh
    ```
    Check your recipient email's inbox and spam folder. Also, check your Exim4 logs (or your MTA's logs) for delivery status:
    ```bash
    tail -f /var/log/exim4/mainlog # For Exim4
    # or
    tail -f /var/log/mail.log # For Postfix/generic mail logs
    ```
5.  **Set up a Cron Job**: To automate the monitoring, schedule the script to run periodically using cron.
    * Open your crontab for editing:
        ```bash
        crontab -e
        ```
    * Add a line at the end of the file. For example, to run the script every 5 minutes:
        ```cron
        */5 * * * * /opt/scripts/notifier.sh >> /var/log/notifier_cron.log 2>&1
        ```
        Replace `/opt/scripts/notifier.sh` with the actual path to your script. The `>> /var/log/notifier_cron.log 2>&1` part redirects all output (including errors) to a log file, which is helpful for debugging cron issues.

## Server Prerequisites

For the generated script to function correctly on your Linux server, ensure the following are in place:

* **Mail Transfer Agent (MTA)**: A configured MTA like Postfix or Exim4 is required for the `mail` command to send emails. Most server control panels (like HestiaCP) configure this automatically.
    * **Debian/Ubuntu**: `sudo apt install mailutils postfix` or `sudo apt install exim4`
    * **RHEL/CentOS**: `sudo yum install mailx postfix`
* **`sysstat` (for CPU Usage)**: If you enable CPU monitoring, the `mpstat` command (part of `sysstat`) is needed.
    * **Debian/Ubuntu**: `sudo apt install sysstat`
    * **RHEL/CentOS**: `sudo yum install sysstat`
* **DNS Authentication (SPF, DKIM, PTR)**: For reliable email delivery, especially to major providers like Gmail, your sender domain must have correct SPF and DKIM DNS records. Additionally, your server's IP address should have a matching Reverse DNS (PTR) record configured by your VPS provider.

## Troubleshooting

If you don't receive emails:

1.  **Check Exim4/MTA Logs**: The most important step. Run `tail -f /var/log/exim4/mainlog` (or your MTA's equivalent) after executing the script to see specific delivery errors. Look for messages related to "authentication," "relay access denied," or "unrouteable address."
2.  **Sender Email Authentication**: Ensure the `Sender Email` you configured in the web tool uses a domain for which your server is properly authorized to send mail (via SPF and DKIM DNS records). If you're unsure, use a known working email from your HestiaCP setup (e.g., an address from `adrian-neagu.ro`).
3.  **PTR Record**: Contact your VPS hosting provider to set a PTR record for your server's IP address that resolves to your server's hostname or a valid mail hostname. Gmail strictly enforces this.
4.  **Firewall**: Verify that your server's firewall (e.g., UFW, iptables) allows outbound connections on SMTP ports (25, 465, 587).
5.  **Spam Folder**: Always check the recipient's spam or junk mail folder.
6.  **Cron Job Logs**: If running via cron, check the log file specified in your cron entry (e.g., `/var/log/notifier_cron.log`) for any script execution errors.

---

## Contributing

Feel free to open issues or submit pull requests if you have suggestions for improvements or encounter any bugs.

## License

This project is open-source and available under the [MIT License](LICENSE) (or choose another appropriate license).
