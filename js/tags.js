/*
phpmybookmarks
Copyright (C) 2013  Jacob Zelek <jacob@jacobzelek.com>

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License along
with this program; if not, write to the Free Software Foundation, Inc.,
51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/

//@todo Make class for Tag with html output - different tag colors (etc)

function Tag_Editor() {}

Tag_Editor.add_tag = function(tag)
{	
	$("#bookmark_tags").append(
			'<span id="tag_' + hex_sha1(tag) + '" ' +
			'onclick="Tag_Editor.delete_tag(\'' + tag + '\')" ' +
			'class="label ' + Tags.get_tag_class(tag) + 'remove_tag">' +
			Tags.scrub_tag(tag) + '</span>&nbsp;');

	Tag_Editor.focus();
}

Tag_Editor.display = function(bookmark_id)
{
	var request_data = {
			action: "get_bookmark",
			bookmark_id: bookmark_id
			};

	Server.send_request(function(response)
	{
		tags = response.tags;
		title = response.title;
		bookmark_id = response.id;
		
		for(var i=0; i < tags.length; i++)
		{
			Tag_Editor.add_tag(tags[i]);
		}
		
		$("#tag_prefixes").html("");
		$("#tag_prefixes").append(Tags.get_html("__") + "&nbsp");
		$("#tag_prefixes").append(Tags.get_html("??") + "&nbsp");
		$("#tag_prefixes").append(Tags.get_html("**") + "&nbsp");
		
		Tag_Editor.set_bookmark_id(bookmark_id);
		$("#bookmark_title").html(title);
		$("#tag_dialog").modal();
	},
	request_data);
}

Tag_Editor.delete_tag = function(tag)
{
	var bookmark_id = Tag_Editor.get_bookmark_id();
	
	var request_data = {
			bookmark_id: bookmark_id,
			tag: tag,
			action: "remove_tag"
			};

	Server.send_request(function(response)
	{
		// Remove from search parameters
		Bookmarks.remove_tag(tag);
		
		// Remove label element from tag editor
		$("#tag_" + hex_sha1(tag)).remove();
		
		// Update bookmarks display
		Bookmarks.fetch();
	},
	request_data);
}

Tag_Editor.clear = function()
{
	$("#search-tags").val("");
	$("#bookmark_tags").html("");
	$("#bookmark_title").html("");
	Tag_Editor.bookmark_id = undefined;
}

Tag_Editor.focus = function()
{
	$("#search-tags").focus();
}

Tag_Editor.get_input = function()
{
	return $("#search-tags").val();
}

Tag_Editor.clear_input = function()
{
	$("#search-tags").val("");
}

Tag_Editor.set_bookmark_id = function(bookmark_id)
{
	Tag_Editor.bookmark_id = bookmark_id;
}

Tag_Editor.get_bookmark_id = function()
{
	return Tag_Editor.bookmark_id;
}

function Tags()
{ }

// Returns css class of tag
Tags.get_tag_class = function(tag)
{
	var first_char = tag[0];
	var css_class = "";
	
	if(first_char == "_")
	{
		css_class = "label-important ";
	}
	else if(first_char == "?")
	{
		css_class = "label-success ";
	}
	else if(first_char == "*")
	{
		css_class = "label-info ";
	}
	
	return css_class;
}

// Remove special char from tag (make suitable for display)
Tags.scrub_tag = function(tag)
{
	var first_char = tag[0];
	var special_char = ["_", "?", "*"];
	
	if(special_char.in_array(first_char, false))
	{
		tag = tag.substr(1);
	}

	return tag;
}

Tags.get_html = function(tag, css_class)
{
	return "<span tag=\"" + tag + "\" class=\"label " + Tags.get_tag_class(tag) + css_class + "\">" +
				Tags.scrub_tag(tag) + "</span>";
}

Tags.display = function()
{
	Tags.min_font = 14;
	Tags.max_font = 30;
	
	var request_data = {
				action: "get_tags"
			};

	Server.send_request(function(response)
	{
		tags = response.tags;
		
		// Array to store all tag weights
		var weights = [];
		
		// For each tag retrieved, iterate to find max and min
		for(i=0; i < tags.length; i++)
		{
			weights.push(tags[i]['count']);
		}

		// Calculate min and max weights in available tags
		var min_weight = Math.min.apply(Math, weights);
		var max_weight = Math.max.apply(Math, weights);

		// Calculate font-size px per weight conversion ratio (pt/weight)
		var conversion = (Tags.max_font - Tags.min_font)/
							(max_weight-min_weight);

		/* 
		 * Calculate intercept - value to add to font-size to ensure 
		 * the lowest font size
		 */
		var intercept = Tags.min_font - min_weight*conversion;

		// Hold HTML before displaying
		var html = "";
		
		// Loop through tags and display them
		for(i=0; i < tags.length; i++)
		{
			tag = tags[i]['tag'];
			weight = tags[i]['count'];

			font_size = Math.round(weight*conversion) + intercept;
			
			html += '<a class="tag" style="font-size:' + font_size + 'px;" ' +
							'tag="' + tag + '" href="#">' + tag + '</a> ';
		}
		
		Display.set_main(html);

		/**
		 * Handles tag clicks
		 */
		$(".tag").click(function(e)
		{
			e.preventDefault();
			tag = $(this).attr('tag');
			Bookmarks.tags.push(tag);
			Bookmarks.fetch();
		});
	},
	request_data);
}