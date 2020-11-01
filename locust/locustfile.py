from locust import HttpUser, between, task


class WebsiteUser(HttpUser):
    wait_time = between(5, 15)
    
    def on_start(self):
        self.client.post("/valider-email", {
           "email": "julien.dauphant@@beta.gouv.fr"
        })
    
    @task
    def index(self):
        self.client.get("/")
        self.client.get("/static/css/custom.css")
        
    def about(self):
        self.client.get("/mentions-legales")
