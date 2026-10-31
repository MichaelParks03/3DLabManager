import UserItem from '../components/UserItem'

import '../css/Account.css'

function Account({ user, team }) {
  return (
    <div className="account">
      <div className="account-container">
        <div className="account-user">
          {/* Maybe add possibility for images */}
          <img src={user.image} alt={user.name}></img>
          <h3>{ user.name }</h3>
          {/* default value should be Null */}
          { user.team && <h4>{ team.name }</h4>}
          <h4>{ user.email }</h4>
        </div>
        <div className="account-info">
          <h4>Checked Out Items: </h4>
          <div className='userItems'>
            { user.items && (
              user.items.map((item) => (
                <UserItem key={item.name} item={item} />
              )
            ))}
          </div>
          { team && (
            <>
              <div className='team-info'>
                <h4>Team Name: </h4>
                <p>{ team.name }</p>
              </div>

              <div className="team-info">
                <h4>Team Members: </h4>
                <div className='team-members'>
                  {team.members.map((member) =>(
                    // could list them out vertically or horizontally
                    <p className="team-member" key={member}>{member}</p>
                  ))}
                </div>
              </div>

              <div className="team-info">
                <h4>Team Desk: </h4>
                { team.desk && (
                  // Should be something like "Desk 5 at ERB 208"
                  <p> { team.desk }</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Account