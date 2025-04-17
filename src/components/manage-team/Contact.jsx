import { useState } from 'react';
import { Info } from 'lucide-react';
import { toast } from "react-hot-toast";
import { FaWhatsapp } from "react-icons/fa";
import { FaDiscord } from "react-icons/fa";
import slack from "../../assets/slack.png";
import { Loader2 } from 'lucide-react';

import axios from 'axios';

const Contact = ({ session, ideaId, team }) => {
  const [whatsappLink, setWhatsappLink] = useState(team?.whatsapp_url || '');
  const [slackLink, setSlackLink] = useState(team?.slack_url || '');
  const [discordLink, setDiscordLink] = useState(team?.discord_url || '');
  const [contactLoading, setContactLoading] = useState(false);
  
  console.log(team);
  const apiUrl = import.meta.env.VITE_BACKEND_URL;

  const handleContactSubmit = async () => {
    setContactLoading(true);
    try {
      const response = await axios.put(`${apiUrl}/api/manage-team/contact-info/${ideaId}`, {
        whatsapp_link: whatsappLink,
        slack_link: slackLink,
        discord_link: discordLink
      }, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      if (response.data.success) {
        toast.success('Communication links updated successfully');
      } else {
        toast.error(response.data.error);
      }
    } catch (error) {
      console.error('Error updating contact info:', error);
      toast.error('Failed to update contact info');
    } finally {
      setContactLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-card text-card-foreground p-6 rounded-lg border border-border shadow-sm">
        <h2 className="text-xl font-bold mb-6">Team Communication</h2>

        <div className='space-y-2 mb-4'>
          {/* WhatsApp Group */}
          <div className="space-y-2 mb-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <FaWhatsapp className="w-4 h-4 text-green-500" />
              WhatsApp Group Link
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                name="whatsapp"
                value={whatsappLink}
                onChange={(e) => {
                  setWhatsappLink(e.target.value);
                  setError('');
                }}
                placeholder="https://chat.whatsapp.com/..."
                className="flex-1 px-3 py-2 bg-white dark:bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Slack Channel */}
          <div className="space-y-2 mb-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <img src={slack} alt="slack" className="w-4 h-4" />
              Slack Channel Invite Link
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                name="slack"
                value={slackLink}
                onChange={(e) => {
                  setSlackLink(e.target.value);
                  setError('');
                }}
                placeholder="https://join.slack.com/..."
                className="flex-1 px-3 py-2 bg-white dark:bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Discord Server */}
          <div className="space-y-2 mb-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <FaDiscord className="w-4 h-4 text-indigo-500" />
              Discord Server Invite Link
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                name="discord"
                value={discordLink}
                onChange={(e) => {
                  setDiscordLink(e.target.value);
                  setError('');
                }}
                placeholder="https://discord.gg/..."
                className="flex-1 px-3 py-2 bg-white dark:bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={contactLoading}
              onClick={handleContactSubmit}
              className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
                {contactLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Communication Links'}
            </button>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">How to get invite links:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>WhatsApp: Open group info → Invite to group via link</li>
                <li>Slack: Channel settings → Invite members → Get invite link</li>
                <li>Discord: Server settings → Invites → Create invite link</li>
              </ul>
            </div>
          </div>
        </div>
        <p className='text-sm text-muted-foreground mt-2'>Note: You must provide at least one communication channel for your team.</p>
      </div>
    </div>
  );
}

export default Contact;