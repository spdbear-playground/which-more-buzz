import twint

# Configure
c = twint.Config()
c.Username = "home"
c.Images = True
c.Format = "{id}\t{date}\t{time}\t{username}\t{link}\t{replies}\t{likes}\t{retweets}\t{tweet}\t{video}\t{photos}"
# Run
twint.run.Search(c)
