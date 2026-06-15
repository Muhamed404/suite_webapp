// =============================================================================
// Jenkinsfile — suite_webapp (without Docker)
// Converted from GitHub Actions deploy.yml
// Jenkins runs on separate server — deploys to OCI server via SSH
// =============================================================================

pipeline {
    agent any

    environment {
        GIT_REPO        = 'git@github-gigate:SecureMagnusLLC/suite_webapp.git'
        GIT_BRANCH_NAME = 'development'

        // OCI Server credentials
        OCI_HOST = credentials('OCI_HOST')
        OCI_USER = credentials('OCI_USER')

        // Redis credentials
        REDIS_URL                = credentials('REDIS_URL')
        REDIS_SERVER_IP          = credentials('REDIS_SERVER_IP')
        REDIS_SERVER_PORT        = credentials('REDIS_SERVER_PORT')
        REDIS_SESSION_SECRET_KEY = credentials('REDIS_SESSION_SECRET_KEY')
    }

    triggers {
        GenericTrigger(
            genericVariables: [
                [
                    key: 'REF',
                    value: '$.ref',
                    expressionType: 'JSONPath'
                ],
                [
                    key: 'CHANGED_FILES',
                    value: '$.commits[*].modified[*]',
                    expressionType: 'JSONPath'
                ],
                [
                    key: 'ADDED_FILES',
                    value: '$.commits[*].added[*]',
                    expressionType: 'JSONPath'
                ],
                [
                    key: 'COMMIT_MESSAGE',
                    value: '$.head_commit.message',
                    expressionType: 'JSONPath'
                ],
                [
                    key: 'COMMIT_SHA',
                    value: '$.head_commit.id',
                    expressionType: 'JSONPath'
                ]
            ],

            regexpFilterText:       '$REF',
            regexpFilterExpression: 'refs/heads/development',

            token: 'suite_webapp_token'
        )
    }

    stages {

        // ─────────────────────────────────────────────────────────────────────
        // Same as: paths filter in GitHub Actions
        // ─────────────────────────────────────────────────────────────────────
        stage('Check Changed Files') {
            steps {
                script {
                    def allChanged = "${env.CHANGED_FILES ?: ''} ${env.ADDED_FILES ?: ''}"

                    echo "Changed files: ${allChanged}"

                    def watchedPaths = [
                        'phishmagnus/',
                        'productsuite/',
                        'commons/',
                        'config/',
                        'logger/',
                        'locales/',
                        'middleware/',
                        'routes/',
                        'views/',
                        'public/',
                        'utility/',
                        'server.js',
                        'package.json',
                        '.github/workflows/deploy.yml',
                        '.github/scripts/deploy.sh',
                        '.github/scripts/register-suite-webapp-service.sh'
                    ]

                    def shouldDeploy = false
                    for (path in watchedPaths) {
                        if (allChanged.contains(path)) {
                            shouldDeploy = true
                            break
                        }
                    }

                    if (!shouldDeploy) {
                        echo "No relevant files changed — skipping deployment"
                        currentBuild.result = 'NOT_BUILT'
                        error("No relevant files changed — pipeline skipped")
                    }

                    echo "Relevant files changed — proceeding with deployment"
                }
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // Same as: verify-development-branch job
        // ─────────────────────────────────────────────────────────────────────
        stage('Verify Branch') {
            steps {
                script {
                    echo "Branch  : ${env.REF}"
                    echo "Commit  : ${env.COMMIT_SHA}"
                    echo "Message : ${env.COMMIT_MESSAGE}"
                }
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // Same as: Checkout code step
        // ─────────────────────────────────────────────────────────────────────
        stage('Checkout Code') {
             steps {
                git branch: "${GIT_BRANCH_NAME}",
                credentialsId: 'github-SecureMagnus-ssh',
                url: "${GIT_REPO}"
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // Same as: suite_webapp_test job
        // ─────────────────────────────────────────────────────────────────────
        stage('Validate Service') {
            steps {
                sh """
                    node --version
                    npm --version
                    echo "Service validation completed"
                """
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // Same as: Log deployment info step
        // ─────────────────────────────────────────────────────────────────────
        stage('Log Deployment Info') {
            steps {
                echo "=========================================="
                echo "Deploying from : ${env.REF}"
                echo "Commit SHA     : ${env.COMMIT_SHA}"
                echo "Message        : ${env.COMMIT_MESSAGE}"
                echo "Build number   : #${env.BUILD_NUMBER}"
                echo "=========================================="
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // Same as: Install production dependencies step
        // ─────────────────────────────────────────────────────────────────────
        stage('Install Dependencies') {
            steps {
                sh """
                    npm install --only=production --no-package-lock
                    echo "Suite Webapp prepared for deployment"
                """
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // Same as: Create deployment package step
        // ─────────────────────────────────────────────────────────────────────
        stage('Create Package') {
            steps {
                sh """
                    mkdir -p deployment/suite_webapp
                    mkdir -p deployment/scripts

                    # Same as GitHub Actions rsync
                    rsync -av --progress ./ deployment/suite_webapp/ \
                        --exclude 'node_modules' \
                        --exclude '.git' \
                        --exclude '.github' \
                        --exclude '.claude' \
                        --exclude '.env' \
                        --exclude '*.md' \
                        --exclude '*.txt' \
                        --exclude 'deployment' \
                        --exclude 'docs'

                    # Copy scripts — same as GitHub Actions
                    cp .github/scripts/deploy.sh deployment/scripts/
                    cp .github/scripts/register-suite-webapp-service.sh deployment/scripts/

                    # Create tar.gz — same as GitHub Actions
                    tar -czf suite_webapp_deployment.tar.gz deployment/

                    echo "Package created successfully"
                """
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // Same as: Check required secrets step
        // ─────────────────────────────────────────────────────────────────────
        stage('Check Required Secrets') {
            steps {
                script {
                    if (!env.OCI_HOST) {
                        error("OCI_HOST secret is not configured")
                    }
                    if (!env.OCI_USER) {
                        error("OCI_USER secret is not configured")
                    }
                    if (!env.REDIS_URL) {
                        error("REDIS_URL secret is not configured")
                    }
                    echo "All required secrets are configured"
                }
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // Same as: Setup SSH + Add OCI server to known hosts + Deploy steps
        // ─────────────────────────────────────────────────────────────────────
        stage('Deploy to OCI Server') {
            steps {
                sshagent(['OCI_SSH_KEY']) {
                    sh """
                        # Add OCI server to known hosts — same as ssh-keyscan in GitHub Actions
                        mkdir -p ~/.ssh
                        ssh-keyscan -H ${OCI_HOST} >> ~/.ssh/known_hosts

                        # Transfer deployment package — same as GitHub Actions scp
                        scp suite_webapp_deployment.tar.gz ${OCI_USER}@${OCI_HOST}:/tmp/suite_webapp_deployment.tar.gz || { echo "Failed to copy deployment package"; exit 1; }
                        scp deployment/scripts/deploy.sh ${OCI_USER}@${OCI_HOST}:/tmp/ || { echo "Failed to copy deploy.sh"; exit 1; }
                        scp deployment/scripts/register-suite-webapp-service.sh ${OCI_USER}@${OCI_HOST}:/tmp/ || { echo "Failed to copy register-suite-webapp-service.sh"; exit 1; }

                        # Verify files exist on remote server — same as GitHub Actions
                        ssh ${OCI_USER}@${OCI_HOST} "ls -la /tmp/deploy.sh /tmp/register-suite-webapp-service.sh"

                        # Execute deployment with environment variables — same as GitHub Actions
                        ssh ${OCI_USER}@${OCI_HOST} "chmod +x /tmp/deploy.sh && chmod +x /tmp/register-suite-webapp-service.sh && \
                            REDIS_URL='${REDIS_URL}' \
                            REDIS_SERVER_IP='${REDIS_SERVER_IP}' \
                            REDIS_SERVER_PORT='${REDIS_SERVER_PORT}' \
                            /tmp/deploy.sh"
                    """
                }
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // Same as: Health check in deploy.sh
        // ─────────────────────────────────────────────────────────────────────
        stage('Health Check') {
            steps {
                sshagent(['OCI_SSH_KEY']) {
                    script {
                        echo "Waiting for service to start..."
                        sh 'sleep 10'

                        def passed = false
                        for (int i = 1; i <= 5; i++) {
                            def status = sh(
                                script: "ssh ${OCI_USER}@${OCI_HOST} 'curl -sf http://localhost:8000/health'",
                                returnStatus: true
                            )
                            if (status == 0) {
                                passed = true
                                echo "Health check passed on attempt ${i}"
                                break
                            }
                            echo "Attempt ${i}/5 failed — retrying in 10s..."
                            sh 'sleep 10'
                        }

                        if (!passed) {
                            sh "ssh ${OCI_USER}@${OCI_HOST} 'sudo journalctl -u suite_webapp --no-pager -n 50' || true"
                            error("suite_webapp health check failed")
                        }
                    }
                }
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Same as: Notify deployment status step
    // ─────────────────────────────────────────────────────────────────────────
    post {
        success {
            echo """
            ==========================================
            Deployment to OCI completed successfully!
            Build   : #${env.BUILD_NUMBER}
            Commit  : ${env.COMMIT_SHA}
            Message : ${env.COMMIT_MESSAGE}
            ==========================================
            """
        }
        failure {
            echo "Deployment to OCI failed!"
            sshagent(['OCI_SSH_KEY']) {
                sh """
                    ssh ${OCI_USER}@${OCI_HOST} '
                        echo "--- Service status ---"
                        sudo systemctl status suite_webapp || true
                        echo "--- Last 50 lines of logs ---"
                        sudo journalctl -u suite_webapp --no-pager -n 50 || true
                    ' || true
                """
            }
        }
        always {
            echo "Pipeline finished: ${currentBuild.currentResult}"
            // Cleanup workspace
            cleanWs()
        }
    }
}