from locust import HttpUser, between, task
from locust.contrib.fasthttp import FastHttpUser

class WebsiteUser(FastHttpUser):
    wait_time = between(5, 15)

    def on_start(self):
        self.client.post("/commencer-authentification", {
           "email": "julien.dauphant@@beta.gouv.fr"
        })

    @task
    def index(self):
        self.client.get("/")
        self.client.get("/static/css/custom.css")

    def about(self):
        self.client.get("/mentions-legales")
