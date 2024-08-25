pipeline {
    agent any
    stages {
        stage("Clone code") {
            steps {
                echo "Cloning the code"
                git url: "https://github.com/Lakshaybogal/fin-tracker", branch: "main"
            }
        }
        stage("Build") {
            steps {
                echo "Building the image"
                sh 'docker build -t docker-app -f Dockerfile .'
            }
        }
        stage("Push to Docker Hub") {
            steps {
                echo "Pushing the image to Docker Hub"
                withCredentials([usernamePassword(credentialsId: "DockerHub", passwordVariable: "dockerHubPass", usernameVariable: "dockerHubname")]) {
                    sh "docker tag docker-app ${dockerHubname}/docker-app:latest"
                    sh "docker login -u ${dockerHubname} -p ${dockerHubPass}"
                    sh "docker push ${dockerHubname}/docker-app:latest"
                }
            }
        }
        stage("Deploy") {
            steps {
                echo "Deploying the container"
                sh "docker-compose down && docker-compose up -d"
            }
        }
    }
}
