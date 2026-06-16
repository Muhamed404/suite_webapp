// =============================================================================
// Jenkinsfile — suite_webapp (without Docker)
// All deployment logic is inline — no external scripts
// Deploys to OCI server via SSH from separate Jenkins server
// =============================================================================

pipeline {
    agent any

    tools {
        nodejs 'nodejs-20.19.2'
    }

    environment {
        GIT_REPO_URL    = 'https://github.com/SecureMagnusLLC/suite_webapp.git'
        GIT_BRANCH_NAME = 'cicd/jenkins-pipeline'

        // Deployment paths
        DEPLOY_DIR      = '/app/secure_magnus/suite_webapp'
        WORKSPACE_DIR   = '/app/secure_magnus/secure_magnus_workspace'
        LOGS_DIR        = '/app/secure_magnus/logs'
        KEYS_DIR        = '/app/secure_magnus/service_suite/keys'
        SERVICE_USER    = 'ubuntu'
        SERVICE_NAME    = 'suite_webapp'
        TEMP_DIR        = '/tmp/suite_webapp_deploy'

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
            regexpFilterExpression: 'refs/heads/cicd/jenkins-pipeline',

            token: 'suite_webapp_token'
        )
    }

    stages {

        // ─────────────────────────────────────────────────────────────────────
        // paths filter
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
                        'Jenkinsfile'
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
        // Verify Branch
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
        // Checkout Code
        // ─────────────────────────────────────────────────────────────────────
        stage('Checkout Code') {
            steps {
                git branch: "${GIT_BRANCH_NAME}",
                    credentialsId: 'github-securemagnus-token',
                    url: "${GIT_REPO_URL}"
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // Validate Service
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
        // Log Deployment Info
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
        // Create deployment package
        // node_modules excluded — will be installed on OCI server
        // ─────────────────────────────────────────────────────────────────────
        stage('Create Package') {
            steps {
                sh """
                    mkdir -p deployment/suite_webapp

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

                    tar -czf suite_webapp_deployment.tar.gz deployment/

                    echo "Package created successfully"
                """
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // Check Required Secrets
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
        // Transfer Package to OCI Server
        // ─────────────────────────────────────────────────────────────────────
        stage('Transfer Package') {
            steps {
                sshagent(['OCI_SSH_KEY']) {
                    sh """
                        mkdir -p ~/.ssh
                        ssh-keyscan -H ${OCI_HOST} >> ~/.ssh/known_hosts
                        scp suite_webapp_deployment.tar.gz ${OCI_USER}@${OCI_HOST}:/tmp/ || { echo "Failed to copy package"; exit 1; }
                        echo "Package transferred successfully"
                    """
                }
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // Setup Directories on OCI Server
        // ─────────────────────────────────────────────────────────────────────
        stage('Setup Directories') {
            steps {
                sshagent(['OCI_SSH_KEY']) {
                    sh """
                        ssh ${OCI_USER}@${OCI_HOST} "
                            set -e
                            sudo mkdir -p ${WORKSPACE_DIR}
                            sudo mkdir -p ${LOGS_DIR}
                            sudo mkdir -p ${KEYS_DIR}
                            sudo chown -R ${SERVICE_USER}:${SERVICE_USER} /app/secure_magnus
                            echo 'Directories created successfully'
                        "
                    """
                }
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // Deploy Code on OCI Server
        // ─────────────────────────────────────────────────────────────────────
        stage('Deploy Code') {
            steps {
                sshagent(['OCI_SSH_KEY']) {
                    sh """
                        ssh ${OCI_USER}@${OCI_HOST} "
                            set -e
                            pm2 stop ${SERVICE_NAME} 2>/dev/null || true
                            pm2 delete ${SERVICE_NAME} 2>/dev/null || true
                            sudo rm -rf ${DEPLOY_DIR}
                            mkdir -p ${TEMP_DIR}
                            cd ${TEMP_DIR}
                            tar -xzf /tmp/suite_webapp_deployment.tar.gz
                            sudo mv deployment/suite_webapp ${DEPLOY_DIR}
                            sudo chown -R ${SERVICE_USER}:${SERVICE_USER} ${DEPLOY_DIR}
                            sudo chmod -R 755 ${DEPLOY_DIR}
                            echo 'Code deployed successfully'
                        "
                    """
                }
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // Install Dependencies on OCI Server
        // installs all dependencies including devDependencies for nodemon
        // ─────────────────────────────────────────────────────────────────────
        stage('Install Dependencies') {
            steps {
                sshagent(['OCI_SSH_KEY']) {
                    sh """
                        ssh ${OCI_USER}@${OCI_HOST} "
                            set -e
                            cd ${DEPLOY_DIR}
                            rm -rf node_modules
                            npm install --no-package-lock
                            echo 'Dependencies installed successfully'
                        "
                    """
                }
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // Create .env on OCI Server
        // ─────────────────────────────────────────────────────────────────────
        stage('Create .env') {
            steps {
                sshagent(['OCI_SSH_KEY']) {
                    sh """
                        ssh ${OCI_USER}@${OCI_HOST} "cat > ${DEPLOY_DIR}/.env << 'ENVEOF'
NODE_ENV=development
HOST=127.0.0.1
PORT=8000
BACKEND_EP=http://127.0.0.1:3000
REDIS_URL=${REDIS_URL}
REDIS_SERVER_IP=${REDIS_SERVER_IP}
REDIS_SERVER_PORT=${REDIS_SERVER_PORT}
REDIS_SESSION_SECRET_KEY=${REDIS_SESSION_SECRET_KEY}
COOKIE_JWT_TOKEN_EXPIRY=10
SECURE_MAGNUS_WORKSPACE=${WORKSPACE_DIR}
BACKEND_TVBS_URL=https://dev-machine.securemagnus.com/tvb
LOGS_DIR=${LOGS_DIR}
LOGS_FILENAME=suite_webapp
BACKEND_SUITE_PUBLIC_KEY_PATH=${KEYS_DIR}/public.key
AWAREMAGNUS_DASHBOARD_URL=https://dev-machine.securemagnus.com/awm/
WEB_TEMPLATE_BUCKET=https://objectstorage.me-riyadh-1.oraclecloud.com/p/OrpyV-tItnmm8cldPMTq9QM0v1o6aoplOpe27Sz92GcZjcG7uagcwnXshXMckKyB/n/axqfg50971fp/b/PHM_Templates/o/
ENVEOF
                        chmod 600 ${DEPLOY_DIR}/.env
                        echo '.env created successfully'
                        "
                    """
                }
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // Start PM2 on OCI Server
        // ─────────────────────────────────────────────────────────────────────
        stage('Start PM2') {
            steps {
                sshagent(['OCI_SSH_KEY']) {
                    sh """
                        ssh ${OCI_USER}@${OCI_HOST} "
                            set -e
                            pm2 start npm \
                                --name ${SERVICE_NAME} \
                                --cwd ${DEPLOY_DIR} \
                                --log ${LOGS_DIR}/suite_webapp.log \
                                --error ${LOGS_DIR}/suite_webapp_error.log \
                                --restart-delay 10000 \
                                -- run development
                            pm2 save
                            pm2 startup systemd -u ${SERVICE_USER} --hp /home/${SERVICE_USER} || true
                            rm -rf ${TEMP_DIR}
                            rm -f /tmp/suite_webapp_deployment.tar.gz
                            echo 'PM2 started successfully'
                        "
                    """
                }
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // Health Check
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
                            sh "ssh ${OCI_USER}@${OCI_HOST} 'pm2 logs ${SERVICE_NAME} --nostream --lines 50' || true"
                            error("suite_webapp health check failed")
                        }
                    }
                }
            }
        }
    }

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
                        echo "--- PM2 status ---"
                        pm2 list || true
                        echo "--- PM2 logs ---"
                        pm2 logs suite_webapp --nostream --lines 50 || true
                    ' || true
                """
            }
        }
        always {
            echo "Pipeline finished: ${currentBuild.currentResult}"
            cleanWs()
        }
    }
}