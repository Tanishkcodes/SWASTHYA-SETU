const fs = require('fs');

const filePath = 'src/components/DoctorCommunities.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// The file is cut off at line 1198 mid-element. We need to restore the closing tags.
const truncationPoint = content.indexOf('                  \n', content.lastIndexOf('comments.map'));
if (truncationPoint !== -1) {
  content = content.substring(0, truncationPoint);
}

const ending = `                  <div key={c.id} className="doc-comm-comment-item">
                    <b>{c.patients?.name || 'Community Member'}</b>
                    <p>{c.body}</p>
                    <small>{timeAgo(c.created_at)}</small>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleAddComment} style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <textarea
                rows={3}
                className="doc-comm-create-textarea"
                placeholder="Write a clinical comment or advisory..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                required
              />
              <button
                type="submit"
                style={{
                  alignSelf: 'flex-end',
                  background: '#087d43',
                  color: '#ffffff',
                  border: 0,
                  borderRadius: '10px',
                  padding: '9px 18px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Post Comment
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
`;

fs.writeFileSync(filePath, content + ending, 'utf8');
console.log('DoctorCommunities.jsx restored. Total lines:', (content + ending).split('\n').length);
