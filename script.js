document.addEventListener('DOMContentLoaded', () => {
    const recipientEmailInput = document.getElementById('recipientEmail');
    const senderEmailInput = document.getElementById('senderEmail');
    const generateScriptBtn = document.getElementById('generateScript');
    const linuxScriptOutput = document.getElementById('linuxScript');
    const copyScriptBtn = document.getElementById('copyScript');

    // Resource Checkboxes and their options
    const notifyDiskCheckbox = document.getElementById('notifyDisk');
    const diskOptionsDiv = document.getElementById('diskOptions');
    const diskThresholdInput = document.getElementById('diskThreshold');

    const notifyCpuCheckbox = document.getElementById('notifyCpu');
    const cpuOptionsDiv = document.getElementById('cpuOptions');
    const cpuThresholdInput = document.getElementById('cpuThreshold');

    const notifyMemoryCheckbox = document.getElementById('notifyMemory');
    const memoryOptionsDiv = document.getElementById('memoryOptions');
    const memoryThresholdInput = document.getElementById('memoryThreshold');

    const notifyServiceCheckbox = document.getElementById('notifyService');
    const serviceOptionsDiv = document.getElementById('serviceOptions');
    const serviceNameInput = document.getElementById('serviceName');

    const notifySshFailedCheckbox = document.getElementById('notifySshFailed');
    const sshFailedOptionsDiv = document.getElementById('sshFailedOptions');
    const sshAttemptsInput = document.getElementById('sshAttempts');

    // Function to toggle visibility of options based on checkbox
    const toggleOptions = (checkbox, optionsDiv) => {
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                optionsDiv.style.display = 'block';
            } else {
                optionsDiv.style.display = 'none';
            }
        });
    };

    toggleOptions(notifyDiskCheckbox, diskOptionsDiv);
    toggleOptions(notifyCpuCheckbox, cpuOptionsDiv);
    toggleOptions(notifyMemoryCheckbox, memoryOptionsDiv);
    toggleOptions(notifyServiceCheckbox, serviceOptionsDiv);
    toggleOptions(notifySshFailedCheckbox, sshFailedOptionsDiv);

    generateScriptBtn.addEventListener('click', () => {
        const recipientEmail = recipientEmailInput.value.trim();
        const senderEmail = senderEmailInput.value.trim();

        if (!recipientEmail) {
            alert('Please enter a recipient email address.');
            return;
        }

        let script = `#!/bin/bash

# Linux Resource Notification Script
# Generated by the Linux Email Notifier Generator

RECIPIENT_EMAIL="${recipientEmail}"
SENDER_EMAIL="${senderEmail}"
HOSTNAME=$(hostname)

# Function to send email
send_email() {
    SUBJECT="$1"
    BODY="$2"
    echo "$BODY" | mail -s "$SUBJECT" -r "$SENDER_EMAIL" "$RECIPIENT_EMAIL"
}

# Check for mail command
if ! command -v mail &> /dev/null; then
    echo "Error: 'mail' command not found. Please install and configure a Mail Transfer Agent (MTA) like Postfix or Sendmail."
    echo "On Debian/Ubuntu: sudo apt install mailutils postfix"
    echo "On RHEL/CentOS: sudo yum install mailx postfix"
    exit 1
fi

`;

        // Disk Usage Notification
        if (notifyDiskCheckbox.checked) {
            const diskThreshold = diskThresholdInput.value;
            script += `
# Disk Usage Check
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//g')
DISK_THRESHOLD=${diskThreshold}
if (( DISK_USAGE > DISK_THRESHOLD )); then
    SUBJECT="ALERT: High Disk Usage on $HOSTNAME"
    BODY="Disk usage on $HOSTNAME is currently at \${DISK_USAGE}% which is above the threshold of \${DISK_THRESHOLD}%.\n\n$(df -h /)"
    send_email "$SUBJECT" "$BODY"
    echo "Disk usage alert sent."
fi
`;
        }

        // CPU Usage Notification
        if (notifyCpuCheckbox.checked) {
            const cpuThreshold = cpuThresholdInput.value;
            script += `
# CPU Usage Check (requires sysstat/mpstat)
if command -v mpstat &> /dev/null; then
    CPU_IDLE=$(mpstat 1 1 | awk 'NR==4 {print $NF}' | cut -d'.' -f1) # Get idle percentage
    CPU_USAGE=$((100 - CPU_IDLE))
    CPU_THRESHOLD=${cpuThreshold}
    if (( CPU_USAGE > CPU_THRESHOLD )); then
        SUBJECT="ALERT: High CPU Usage on $HOSTNAME"
        BODY="CPU usage on $HOSTNAME is currently at \${CPU_USAGE}% which is above the threshold of \${CPU_THRESHOLD}%.\n\n$(mpstat 1 1)"
        send_email "$SUBJECT" "$BODY"
        echo "CPU usage alert sent."
    fi
else
    echo "Warning: 'mpstat' command not found. Skipping CPU usage check. Please install sysstat (e.g., sudo apt install sysstat)."
fi
`;
        }

        // Memory Usage Notification
        if (notifyMemoryCheckbox.checked) {
            const memoryThreshold = memoryThresholdInput.value;
            script += `
# Memory Usage Check
MEM_TOTAL=$(free -m | awk 'NR==2 {print $2}')
MEM_USED=$(free -m | awk 'NR==2 {print $3}')
MEM_PERCENT=$(( (MEM_USED * 100) / MEM_TOTAL ))
MEMORY_THRESHOLD=${memoryThreshold}
if (( MEM_PERCENT > MEMORY_THRESHOLD )); then
    SUBJECT="ALERT: High Memory Usage on $HOSTNAME"
    BODY="Memory usage on $HOSTNAME is currently at \${MEM_PERCENT}% which is above the threshold of \${MEMORY_THRESHOLD}%.\n\n$(free -h)"
    send_email "$SUBJECT" "$BODY"
    echo "Memory usage alert sent."
fi
`;
        }

        // Specific Service Status Notification
        if (notifyServiceCheckbox.checked) {
            const serviceName = serviceNameInput.value.trim();
            if (serviceName) {
                script += `
# Service Status Check: ${serviceName}
SERVICE_NAME="${serviceName}"
if ! systemctl is-active --quiet "$SERVICE_NAME"; then
    SUBJECT="ALERT: Service $SERVICE_NAME is NOT running on $HOSTNAME"
    BODY="The service '$SERVICE_NAME' on $HOSTNAME is currently not running.\n\n$(systemctl status "$SERVICE_NAME" | head -n 7)"
    send_email "$SUBJECT" "$BODY"
    echo "Service '$SERVICE_NAME' alert sent."
fi
`;
            } else {
                alert('Please enter a service name for service status notification.');
            }
        }

        // Failed SSH Login Attempts Notification
        if (notifySshFailedCheckbox.checked) {
            const sshAttempts = sshAttemptsInput.value;
            script += `
# Failed SSH Login Attempts Check
FAILED_SSH_ATTEMPTS=$(grep "Failed password" /var/log/auth.log | wc -l)
SSH_ATTEMPTS_THRESHOLD=${sshAttempts}
if (( FAILED_SSH_ATTEMPTS >= SSH_ATTEMPTS_THRESHOLD )); then
    SUBJECT="ALERT: High Failed SSH Login Attempts on $HOSTNAME"
    BODY="There have been \${FAILED_SSH_ATTEMPTS} failed SSH login attempts on $HOSTNAME, exceeding the threshold of \${SSH_ATTEMPTS_THRESHOLD}.
    \n\nRecent failed attempts:\n$(grep "Failed password" /var/log/auth.log | tail -n 10)"
    send_email "$SUBJECT" "$BODY"
    echo "Failed SSH attempts alert sent."
    # Optional: Clear the count or log for next check if desired
    # echo "" > /var/log/auth.log # USE WITH CAUTION: This clears the log! Consider more sophisticated log rotation/tracking.
fi
`;
        }


        linuxScriptOutput.textContent = script.trim();
    });

    copyScriptBtn.addEventListener('click', () => {
        const scriptText = linuxScriptOutput.textContent;
        if (scriptText) {
            navigator.clipboard.writeText(scriptText).then(() => {
                alert('Script copied to clipboard!');
            }).catch(err => {
                console.error('Failed to copy script: ', err);
                alert('Failed to copy script. Please copy manually.');
            });
        } else {
            alert('No script to copy. Please generate one first.');
        }
    });
});