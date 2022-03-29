const { createClient } = require("@supabase/supabase-js");
const { createRemoteFileNode } = require(`gatsby-source-filesystem`);

exports.sourceNodes = async (
  { actions, createContentDigest, createNodeId },
  pluginOptions
) => {
  const { url, apiKey } = pluginOptions;
  const { createNode, createParentChildLink } = actions;
  const supabase = createClient(url, apiKey);
  const getQuestions = async () => {
    const messages = await supabase
      .from("squeak_messages")
      .select("subject, id, slug")
      .eq("published", true)
      .order("created_at");
    return Promise.all(
      messages?.data.map((message) => {
        return supabase
          .from("squeak_replies")
          .select(
            `
                id,
                created_at,
                body,
                squeak_profiles!replies_profile_id_fkey (
                    first_name, avatar
                )
                `
          )
          .eq("message_id", message.id)
          .order("created_at")
          .then((data) => ({
            message,
            replies: data.data,
          }));
      })
    );
  };
  const createReplies = (node, replies) => {
    for (const reply of replies) {
      const { body, squeak_profiles: user, id, created_at } = reply;
      const replyId = createNodeId(`reply-${id}`);
      const replyNode = {
        id: replyId,
        parent: null,
        children: [],
        internal: {
          type: `Reply`,
          contentDigest: createContentDigest(body),
          content: body,
          mediaType: "text/markdown",
        },
        name: user?.first_name || "Anonymous",
        imageURL: user?.avatar,
        created_at: new Date(created_at),
      };
      createNode(replyNode);
      createParentChildLink({ parent: node, child: replyNode });
    }
  };
  const questions = await getQuestions();
  questions.forEach(({ message: { slug, id }, replies }) => {
    const question = {
      slug,
      replies,
    };
    const node = {
      id: createNodeId(`question-${id}`),
      parent: null,
      children: [],
      internal: {
        type: `Question`,
        contentDigest: createContentDigest(question),
      },
      ...question,
    };
    createNode(node);
    replies && createReplies(node, replies);
  });
};

exports.onCreateNode = async ({
  node,
  actions,
  store,
  cache,
  createNodeId,
}) => {
  const { createNode } = actions;
  if (node.internal.type === "Reply") {
    async function createImageNode(imageURL) {
      return createRemoteFileNode({
        url: imageURL,
        parentNodeId: node.id,
        createNode,
        createNodeId,
        cache,
        store,
      }).catch((e) => console.error(e));
    }
    if (node.imageURL) {
      const imageNode = await createImageNode(node.imageURL);
      node.avatar___NODE = imageNode && imageNode.id;
    }
  }
};
