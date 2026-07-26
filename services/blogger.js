const { publisher } = require("../config/publisher");
const { google } = require("googleapis");
const { authorizeGoogle } = require("../auth/googleAuth");
const { buildArticleHtml } = require("./htmlBuilder");


async function publishToBlogger({
  article,
  seo,
  imageUrl,
  imageData,
}) {
  const auth = await authorizeGoogle();

  const blogger = google.blogger({
    version: "v3",
    auth,
  });

  const htmlContent = buildArticleHtml({
    article,
    seo,
    imageUrl,
    imageData,
  });

  const response = await blogger.posts.insert({
    blogId: publisher.blogger.blogId,
    isDraft: publisher.blogger.createAsDraft,
    
    requestBody: {
      title: seo.seoTitle,
      content: htmlContent,
      labels: seo.tags,
    },
  });

  return response.data;
}

module.exports = {
  publishToBlogger,
};